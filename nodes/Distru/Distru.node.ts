import {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

import { buildResourceOperationProperties, RESOURCE_OPTIONS } from './lib/resourceOperations';
import { buildOperationFields } from './lib/operationFields';

type HttpMethod = 'GET' | 'POST' | 'DELETE';

interface OperationConfig {
	method: HttpMethod;
	path: string;
	usesFormData?: boolean;
	pathIdRequired?: boolean;
}

const OPERATION_CONFIG: Record<string, OperationConfig> = {
	getAdjustments: { method: 'GET', path: '/stock-adjustments' },
	getAssemblies: { method: 'GET', path: '/assemblies' },
	getBatches: { method: 'GET', path: '/batches' },
	getCompanies: { method: 'GET', path: '/companies' },
	getContacts: { method: 'GET', path: '/contacts' },
	getInventory: { method: 'GET', path: '/inventory' },
	getInvoices: { method: 'GET', path: '/invoices' },
	getInvoiceById: { method: 'GET', path: '/invoices/:id', pathIdRequired: true },
	getLocations: { method: 'GET', path: '/locations' },
	getOrders: { method: 'GET', path: '/orders' },
	getOrderById: { method: 'GET', path: '/orders/:id', pathIdRequired: true },
	getPackages: { method: 'GET', path: '/packages' },
	getPaymentMethods: { method: 'GET', path: '/payment-methods' },
	getProductPosMappings: { method: 'GET', path: '/product-pos-mappings' },
	getProducts: { method: 'GET', path: '/products' },
	getPurchases: { method: 'GET', path: '/purchases' },
	getStrains: { method: 'GET', path: '/strains' },
	getTestResults: { method: 'GET', path: '/test-results' },
	getUsers: { method: 'GET', path: '/users' },
	postAdjustment: { method: 'POST', path: '/stock-adjustments' },
	postBatch: { method: 'POST', path: '/batches' },
	upsertCompany: { method: 'POST', path: '/companies' },
	upsertContact: { method: 'POST', path: '/contacts' },
	postCustomField: { method: 'POST', path: '/custom-fields' },
	postFileAttachment: { method: 'POST', path: '/file-attachments', usesFormData: true },
	upsertInvoice: { method: 'POST', path: '/invoices' },
	postInvoicePayment: { method: 'POST', path: '/invoices/:id/payments', pathIdRequired: true },
	upsertOrder: { method: 'POST', path: '/orders' },
	upsertProductPosMapping: { method: 'POST', path: '/product-pos-mappings' },
	deleteProductPosMapping: { method: 'DELETE', path: '/product-pos-mappings/:id', pathIdRequired: true },
	upsertProduct: { method: 'POST', path: '/products' },
	upsertProductImages: { method: 'POST', path: '/products/:id/images', pathIdRequired: true },
	upsertPurchase: { method: 'POST', path: '/purchases' },
	postPurchasePayment: { method: 'POST', path: '/purchases/:id/payments', pathIdRequired: true },
	upsertTestResult: { method: 'POST', path: '/test-results' },
};

const PATH_ID_OPERATIONS = Object.keys(OPERATION_CONFIG).filter(
	(op) => OPERATION_CONFIG[op].pathIdRequired,
);

const FORM_DATA_OPERATIONS = Object.keys(OPERATION_CONFIG).filter(
	(op) => OPERATION_CONFIG[op].usesFormData,
);

function removeEmpty(value: unknown): unknown {
	if (Array.isArray(value)) {
		return value
			.map((entry) => removeEmpty(entry))
			.filter((entry) => entry !== undefined && entry !== '');
	}

	if (value && typeof value === 'object') {
		const result: IDataObject = {};
		for (const [key, entry] of Object.entries(value as IDataObject)) {
			const cleaned = removeEmpty(entry);
			if (cleaned !== undefined && cleaned !== '') {
				result[key] = cleaned;
			}
		}
		return Object.keys(result).length ? result : undefined;
	}

	return value;
}

/**
 * Build query string from additionalFields for GET operations
 */
function buildQueryString(additionalFields: IDataObject): IDataObject {
	const qs: IDataObject = {};

	for (const [key, value] of Object.entries(additionalFields)) {
		// Handle pagination
		if (key === 'page_number' && value) {
			qs['page[number]'] = value;
		} else if (key === 'page_size' && value) {
			qs['page[size]'] = value;
		} else if (value !== undefined && value !== '' && value !== null) {
			qs[key] = value;
		}
	}

	return (removeEmpty(qs) as IDataObject) ?? {};
}

/**
 * Build request body from operation-specific parameters
 */
function buildRequestBody(
	context: IExecuteFunctions,
	operation: string,
	index: number,
): IDataObject {
	const body: IDataObject = {};

	// Handle operations with direct field parameters
	if (operation === 'postAdjustment') {
		const productId = context.getNodeParameter('product_id', index, '') as string;
		const batchId = context.getNodeParameter('batch_id', index, '') as string;
		const packageId = context.getNodeParameter('package_id', index, '') as string;
		const completionDatetime = context.getNodeParameter('completion_datetime', index) as string;
		const reason = context.getNodeParameter('reason', index) as string;
		const locationId = context.getNodeParameter('location_id', index, '') as string;
		const quantity = context.getNodeParameter('quantity', index, 0) as number;
		const complianceQuantity = context.getNodeParameter('compliance_quantity', index, 0) as number;

		if (productId) body.product_id = productId;
		if (batchId) body.batch_id = batchId;
		if (packageId) body.package_id = packageId;
		body.completion_datetime = completionDatetime;
		body.reason = reason;
		if (locationId) body.location_id = locationId;
		if (quantity) body.quantity = quantity;
		if (complianceQuantity) body.compliance_quantity = complianceQuantity;

		// Add additional fields
		const additionalFields = context.getNodeParameter('additionalFields', index, {}) as IDataObject;
		Object.assign(body, additionalFields);
	} else if (operation === 'postBatch') {
		const productId = context.getNodeParameter('product_id', index) as string;
		body.product_id = productId;

		const additionalFields = context.getNodeParameter('additionalFields', index, {}) as IDataObject;
		Object.assign(body, additionalFields);
	} else if (operation === 'upsertContact') {
		const firstName = context.getNodeParameter('first_name', index) as string;
		body.first_name = firstName;

		const additionalFields = context.getNodeParameter('additionalFields', index, {}) as IDataObject;
		Object.assign(body, additionalFields);
	} else if (operation === 'postCustomField') {
		const name = context.getNodeParameter('name', index) as string;
		const parentObject = context.getNodeParameter('parent_object', index) as string;
		const fieldType = context.getNodeParameter('field_type', index) as string;

		body.name = name;
		body.parent_object = parentObject;
		body.field_type = fieldType;

		const additionalFields = context.getNodeParameter('additionalFields', index, {}) as IDataObject;
		Object.assign(body, additionalFields);
	} else if (operation === 'upsertProduct') {
		// All fields are optional for upsert pattern
		const additionalFields = context.getNodeParameter('additionalFields', index, {}) as IDataObject;
		Object.assign(body, additionalFields);
	} else if (operation === 'upsertProductImages') {
		const images = context.getNodeParameter('images', index, []) as string[];
		body.images = images;
	} else if (operation === 'upsertProductPosMapping') {
		const productId = context.getNodeParameter('product_id', index) as string;
		body.product_id = productId;

		const additionalFields = context.getNodeParameter('additionalFields', index, {}) as IDataObject;
		Object.assign(body, additionalFields);
	} else if (operation === 'upsertOrder') {
		const companyId = context.getNodeParameter('company_id', index) as string;
		body.company_id = companyId;

		const additionalFields = context.getNodeParameter('additionalFields', index, {}) as IDataObject;
		Object.assign(body, additionalFields);

		// Handle items
		const itemsParam = context.getNodeParameter('items', index, {}) as IDataObject;
		if (itemsParam.item && Array.isArray(itemsParam.item)) {
			body.items = itemsParam.item;
		}

		// Handle charges
		const chargesParam = context.getNodeParameter('charges', index, {}) as IDataObject;
		if (chargesParam.charge && Array.isArray(chargesParam.charge)) {
			body.charges = chargesParam.charge;
		}
	} else if (operation === 'upsertInvoice') {
		const orderId = context.getNodeParameter('order_id', index) as string;
		body.order_id = orderId;

		const additionalFields = context.getNodeParameter('additionalFields', index, {}) as IDataObject;
		Object.assign(body, additionalFields);

		const itemsParam = context.getNodeParameter('items', index, {}) as IDataObject;
		if (itemsParam.item && Array.isArray(itemsParam.item)) {
			body.items = itemsParam.item;
		}

		const chargesParam = context.getNodeParameter('charges', index, {}) as IDataObject;
		if (chargesParam.charge && Array.isArray(chargesParam.charge)) {
			body.charges = chargesParam.charge;
		}
	} else if (operation === 'postInvoicePayment' || operation === 'postPurchasePayment') {
		const paymentMethodId = context.getNodeParameter('payment_method_id', index) as string;
		const amount = context.getNodeParameter('amount', index) as number;
		const paymentDatetime = context.getNodeParameter('payment_datetime', index) as string;
		const description = context.getNodeParameter('description', index) as string;

		body.payment_method_id = paymentMethodId;
		body.amount = amount;
		body.payment_datetime = paymentDatetime;
		body.description = description;

		const additionalFields = context.getNodeParameter('additionalFields', index, {}) as IDataObject;
		Object.assign(body, additionalFields);
	} else if (operation === 'upsertPurchase') {
		const companyId = context.getNodeParameter('company_id', index) as string;
		body.company_id = companyId;

		const additionalFields = context.getNodeParameter('additionalFields', index, {}) as IDataObject;
		Object.assign(body, additionalFields);

		const itemsParam = context.getNodeParameter('items', index, {}) as IDataObject;
		if (itemsParam.item && Array.isArray(itemsParam.item)) {
			body.items = itemsParam.item;
		}

		const chargesParam = context.getNodeParameter('charges', index, {}) as IDataObject;
		if (chargesParam.charge && Array.isArray(chargesParam.charge)) {
			body.charges = chargesParam.charge;
		}
	} else if (operation === 'upsertCompany' || operation === 'upsertTestResult') {
		// These operations only have additionalFields
		const additionalFields = context.getNodeParameter('additionalFields', index, {}) as IDataObject;
		Object.assign(body, additionalFields);
	}

	return (removeEmpty(body) as IDataObject) ?? {};
}

export class Distru implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Distru',
		name: 'distru',
		icon: 'file:distru.svg',
		group: ['transform'],
		version: 5,
		subtitle: '={{$parameter["resource"] + ": " + $parameter["operation"]}}',
		description: 'Interact with the Distru Public API v1',
		defaults: {
			name: 'Distru',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'distruApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				required: true,
				default: 'products',
				options: RESOURCE_OPTIONS,
				description:
					'API area. The action picker groups operations under each resource (same pattern as the built-in n8n node).',
			},
			...buildResourceOperationProperties(),
			{
				displayName: 'Resource ID',
				name: 'pathId',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: PATH_ID_OPERATIONS,
					},
				},
			},
			{
				displayName: 'Binary Property',
				name: 'binaryPropertyName',
				type: 'string',
				default: 'data',
				required: true,
				displayOptions: {
					show: {
						operation: FORM_DATA_OPERATIONS,
					},
				},
				description: 'Binary property containing the file to upload',
			},
			// Operation-specific fields
			...buildOperationFields(),
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const input = this.getInputData();
		const output: INodeExecutionData[] = [];
		const credentials = await this.getCredentials('distruApi');

		if (!credentials?.apiToken) {
			throw new NodeOperationError(this.getNode(), 'Distru API token is not set');
		}

		const baseUrl = credentials.useStaging
			? 'https://staging.distru.com/public/v1'
			: 'https://app.distru.com/public/v1';

		for (let i = 0; i < input.length; i++) {
			try {
				const operation = this.getNodeParameter('operation', i) as string;
				const config = OPERATION_CONFIG[operation];

				if (!config) {
					throw new NodeOperationError(this.getNode(), `Unsupported operation: ${operation}`);
				}

				let path = config.path;
				if (config.pathIdRequired) {
					const pathId = this.getNodeParameter('pathId', i) as string;
					if (!pathId) {
						throw new NodeOperationError(this.getNode(), 'Resource ID is required');
					}
					path = path.replace(':id', encodeURIComponent(pathId));
				}

				const requestOptions: IDataObject = {
					method: config.method,
					uri: `${baseUrl}${path}`,
					headers: {
						Authorization: `Bearer ${credentials.apiToken}`,
					},
					json: true,
				};

				// Handle GET operations with query parameters
				if (config.method === 'GET') {
					const additionalFields = this.getNodeParameter('additionalFields', i, {}) as IDataObject;

					// Special handling for inventory grouping parameter
					if (operation === 'getInventory') {
						const grouping = this.getNodeParameter('grouping', i, ['PRODUCT']) as string[];
						const qs: IDataObject = {};
						grouping.forEach((g, idx) => {
							qs[`grouping[${idx}]`] = g;
						});
						Object.assign(qs, buildQueryString(additionalFields));
						requestOptions.qs = qs;
					} else {
						requestOptions.qs = buildQueryString(additionalFields);
					}
				}

				// Handle POST/DELETE operations with request body
				if (config.method === 'POST' && !config.usesFormData) {
					requestOptions.body = buildRequestBody(this, operation, i);
				}

				// Handle file upload operations
				if (config.usesFormData) {
					const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i) as string;
					const binaryData = input[i].binary?.[binaryPropertyName];

					if (!binaryData) {
						throw new NodeOperationError(
							this.getNode(),
							`Missing binary data in property "${binaryPropertyName}"`,
						);
					}

					const buffer = await this.helpers.getBinaryDataBuffer(i, binaryPropertyName);

					// Build form data fields based on operation
					const formData: IDataObject = {};

					if (operation === 'postFileAttachment') {
						const attachTo = this.getNodeParameter('attachTo', i) as string;
						const entityId = this.getNodeParameter('entityId', i) as string;
						const additionalFields = this.getNodeParameter('additionalFields', i, {}) as IDataObject;

						// Map attachTo to the correct field name
						const fieldMap: Record<string, string> = {
							product: 'product_id',
							order: 'order_id',
							purchase: 'purchase_id',
							invoice: 'invoice_id',
							batch: 'batch_id',
							contact: 'contact_id',
							company: 'company_relationship_id',
							assembly: 'assembly_id',
						};

						formData[fieldMap[attachTo]] = entityId;

						if (additionalFields.name) {
							formData.name = additionalFields.name;
						}
					}

					requestOptions.json = false;
					requestOptions.formData = {
						...formData,
						file: {
							value: buffer,
							options: {
								filename: binaryData.fileName ?? 'upload.bin',
								contentType: binaryData.mimeType ?? 'application/octet-stream',
							},
						},
					};
				}

				const response = await this.helpers.request(requestOptions);
				const payload =
					typeof response === 'object' && response !== null && 'data' in (response as IDataObject)
						? (response as IDataObject).data
						: response;

				if (Array.isArray(payload)) {
					for (const row of payload) {
						output.push({ json: row as IDataObject });
					}
				} else if (payload === '' || payload === undefined || payload === null) {
					output.push({ json: { success: true } });
				} else {
					output.push({ json: payload as IDataObject });
				}
			} catch (error) {
				if (this.continueOnFail()) {
					output.push({
						json: { error: (error as Error).message },
					});
					continue;
				}
				throw error;
			}
		}

		return [output];
	}
}