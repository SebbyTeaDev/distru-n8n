import { IDataObject, IExecuteFunctions, INodeExecutionData, INodeType, INodeTypeDescription, NodeOperationError } from 'n8n-workflow';

type HttpMethod = 'GET' | 'POST' | 'DELETE';

interface OperationConfig {
	method: HttpMethod;
	path: string;
	usesQuery?: boolean;
	usesBody?: boolean;
	usesFormData?: boolean;
	pathIdRequired?: boolean;
}

const OPERATION_CONFIG: Record<string, OperationConfig> = {
	getAdjustments: { method: 'GET', path: '/adjustments', usesQuery: true },
	getAssemblies: { method: 'GET', path: '/assemblies', usesQuery: true },
	getBatches: { method: 'GET', path: '/batches', usesQuery: true },
	getCompanies: { method: 'GET', path: '/companies', usesQuery: true },
	getContacts: { method: 'GET', path: '/contacts', usesQuery: true },
	getInventory: { method: 'GET', path: '/inventory', usesQuery: true },
	getInvoices: { method: 'GET', path: '/invoices', usesQuery: true },
	getInvoiceById: { method: 'GET', path: '/invoices/:id', pathIdRequired: true },
	getLocations: { method: 'GET', path: '/locations', usesQuery: true },
	getOrders: { method: 'GET', path: '/orders', usesQuery: true },
	getOrderById: { method: 'GET', path: '/orders/:id', pathIdRequired: true },
	getPackages: { method: 'GET', path: '/packages', usesQuery: true },
	getPaymentMethods: { method: 'GET', path: '/payment-methods', usesQuery: true },
	getProductPosMappings: { method: 'GET', path: '/product-pos-mappings', usesQuery: true },
	getProducts: { method: 'GET', path: '/products', usesQuery: true },
	getPurchases: { method: 'GET', path: '/purchases', usesQuery: true },
	getStrains: { method: 'GET', path: '/strains', usesQuery: true },
	getTestResults: { method: 'GET', path: '/test-results', usesQuery: true },
	getUsers: { method: 'GET', path: '/users', usesQuery: true },
	postAdjustment: { method: 'POST', path: '/adjustments', usesQuery: true },
	postBatch: { method: 'POST', path: '/batches', usesQuery: true },
	upsertCompany: { method: 'POST', path: '/companies', usesQuery: true },
	upsertContact: { method: 'POST', path: '/contacts', usesQuery: true },
	postCustomField: { method: 'POST', path: '/custom-fields', usesQuery: true },
	postFileAttachment: { method: 'POST', path: '/file-attachments', usesFormData: true },
	upsertInvoice: { method: 'POST', path: '/invoices', usesQuery: true, usesBody: true },
	postInvoicePayment: { method: 'POST', path: '/invoices/:id/payments', pathIdRequired: true, usesQuery: true },
	upsertOrder: { method: 'POST', path: '/orders', usesQuery: true, usesBody: true },
	upsertProductPosMapping: { method: 'POST', path: '/product-pos-mappings', usesBody: true },
	deleteProductPosMapping: { method: 'DELETE', path: '/product-pos-mappings/:id', pathIdRequired: true },
	upsertProduct: { method: 'POST', path: '/products', usesQuery: true },
	upsertProductImages: { method: 'POST', path: '/products/:id/images', pathIdRequired: true, usesBody: true },
	upsertPurchase: { method: 'POST', path: '/purchases', usesQuery: true, usesBody: true },
	postPurchasePayment: { method: 'POST', path: '/purchases/:id/payments', pathIdRequired: true, usesQuery: true },
	upsertTestResult: { method: 'POST', path: '/test-results', usesQuery: true },
};

const PATH_ID_OPERATIONS = Object.keys(OPERATION_CONFIG).filter(
	(op) => OPERATION_CONFIG[op].pathIdRequired,
);

const BODY_OPERATIONS = Object.keys(OPERATION_CONFIG).filter((op) => OPERATION_CONFIG[op].usesBody);

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

function normalizeQuery(query: IDataObject): IDataObject {
	const normalized: IDataObject = { ...query };
	const page = normalized.page;

	if (page && typeof page === 'object' && !Array.isArray(page)) {
		const pageObject = page as IDataObject;
		if (pageObject.number !== undefined) {
			normalized['page[number]'] = pageObject.number;
		}
		if (pageObject.size !== undefined) {
			normalized['page[size]'] = pageObject.size;
		}
		delete normalized.page;
	}

	if (normalized.page_number !== undefined) {
		normalized['page[number]'] = normalized.page_number;
		delete normalized.page_number;
	}

	if (normalized.page_size !== undefined) {
		normalized['page[size]'] = normalized.page_size;
		delete normalized.page_size;
	}

	return (removeEmpty(normalized) as IDataObject) ?? {};
}

export class Distru implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Distru',
		name: 'distru',
		icon: 'file:distru.svg',
		group: ['transform'],
		version: 2,
		subtitle: '={{$parameter["operation"]}}',
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
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				required: true,
				default: 'getProducts',
				options: [
					{ name: 'Delete Product POS Mapping', value: 'deleteProductPosMapping' },
					{ name: 'Get Adjustments', value: 'getAdjustments' },
					{ name: 'Get Assemblies', value: 'getAssemblies' },
					{ name: 'Get Batches', value: 'getBatches' },
					{ name: 'Get Companies', value: 'getCompanies' },
					{ name: 'Get Contacts', value: 'getContacts' },
					{ name: 'Get Inventory', value: 'getInventory' },
					{ name: 'Get Invoice By ID', value: 'getInvoiceById' },
					{ name: 'Get Invoices', value: 'getInvoices' },
					{ name: 'Get Locations', value: 'getLocations' },
					{ name: 'Get Order By ID', value: 'getOrderById' },
					{ name: 'Get Orders', value: 'getOrders' },
					{ name: 'Get Packages', value: 'getPackages' },
					{ name: 'Get Payment Methods', value: 'getPaymentMethods' },
					{ name: 'Get Product POS Mappings', value: 'getProductPosMappings' },
					{ name: 'Get Products', value: 'getProducts' },
					{ name: 'Get Purchases', value: 'getPurchases' },
					{ name: 'Get Strains', value: 'getStrains' },
					{ name: 'Get Test Results', value: 'getTestResults' },
					{ name: 'Get Users', value: 'getUsers' },
					{ name: 'Insert File Attachment', value: 'postFileAttachment' },
					{ name: 'Post Adjustment', value: 'postAdjustment' },
					{ name: 'Post Batch', value: 'postBatch' },
					{ name: 'Post Custom Field', value: 'postCustomField' },
					{ name: 'Post Invoice Payment', value: 'postInvoicePayment' },
					{ name: 'Post Purchase Payment', value: 'postPurchasePayment' },
					{ name: 'Upsert Company', value: 'upsertCompany' },
					{ name: 'Upsert Contact', value: 'upsertContact' },
					{ name: 'Upsert Invoice', value: 'upsertInvoice' },
					{ name: 'Upsert Order', value: 'upsertOrder' },
					{ name: 'Upsert Product', value: 'upsertProduct' },
					{ name: 'Upsert Product Images', value: 'upsertProductImages' },
					{ name: 'Upsert Product POS Mapping', value: 'upsertProductPosMapping' },
					{ name: 'Upsert Purchase', value: 'upsertPurchase' },
					{ name: 'Upsert Test Result', value: 'upsertTestResult' },
				],
			},
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
				displayName: 'Query',
				name: 'query',
				type: 'json',
				default: '{}',
				description:
					'Query string values. Use page as {"number":1,"size":500} or page_number/page_size. Datetime filters support ranges, for example {"updated_datetime":"2025-05-04T04:40:21.817570Z,2025-09-18T16:27:44.946871Z"}',
			},
			{
				displayName: 'Body',
				name: 'body',
				type: 'json',
				default: '{}',
				displayOptions: {
					show: {
						operation: BODY_OPERATIONS,
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
			{
				displayName: 'Form Data',
				name: 'formData',
				type: 'json',
				default: '{}',
				displayOptions: {
					show: {
						operation: FORM_DATA_OPERATIONS,
					},
				},
				description: 'Additional multipart fields such as product_id, order_id, name, etc',
			},
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

				if (config.usesQuery) {
					const query = this.getNodeParameter('query', i, {}) as IDataObject;
					requestOptions.qs = normalizeQuery(query);
				}

				if (config.usesBody) {
					const body = this.getNodeParameter('body', i, {}) as IDataObject;
					requestOptions.body = (removeEmpty(body) as IDataObject) ?? {};
				}

				if (config.usesFormData) {
					const formData = (this.getNodeParameter('formData', i, {}) as IDataObject) ?? {};
					const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i) as string;
					const binaryData = input[i].binary?.[binaryPropertyName];

					if (!binaryData) {
						throw new NodeOperationError(
							this.getNode(),
							`Missing binary data in property "${binaryPropertyName}"`,
						);
					}

					const buffer = await this.helpers.getBinaryDataBuffer(i, binaryPropertyName);
					const cleanedFormData = (removeEmpty(formData) as IDataObject) ?? {};

					requestOptions.json = false;
					requestOptions.formData = {
						...cleanedFormData,
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