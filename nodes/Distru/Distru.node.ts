import {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

import { buildResourceOperationProperties, RESOURCE_OPTIONS } from './lib/resourceOperations';

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

const QUERY_OPERATIONS = Object.keys(OPERATION_CONFIG).filter(
	(op) => OPERATION_CONFIG[op].usesQuery,
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

function buildQueryFromUi(
	pageNumber: number,
	pageSize: number,
	additional: { queryParameter?: Array<{ name: string; value: string }> },
): IDataObject {
	const qs: IDataObject = {};
	if (pageNumber > 0) {
		qs['page[number]'] = pageNumber;
	}
	if (pageSize > 0) {
		qs['page[size]'] = pageSize;
	}
	for (const row of additional.queryParameter ?? []) {
		const key = (row.name ?? '').trim();
		if (key) {
			qs[key] = row.value;
		}
	}
	return (removeEmpty(qs) as IDataObject) ?? {};
}

function collectFormFields(additional: {
	formField?: Array<{ name: string; value: string }>;
}): IDataObject {
	const out: IDataObject = {};
	for (const row of additional.formField ?? []) {
		const key = (row.name ?? '').trim();
		if (key) {
			out[key] = row.value;
		}
	}
	return (removeEmpty(out) as IDataObject) ?? {};
}

export class Distru implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Distru',
		name: 'distru',
		icon: 'file:distru.svg',
		group: ['transform'],
		version: 4,
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
				displayName: 'Page Number',
				name: 'pageNumber',
				type: 'number',
				typeOptions: { minValue: 0 },
				default: 0,
				description: 'Sent as page[number]. Use 0 to omit pagination for this field.',
				displayOptions: {
					show: {
						operation: QUERY_OPERATIONS,
					},
				},
			},
			{
				displayName: 'Page Size',
				name: 'pageSize',
				type: 'number',
				typeOptions: { minValue: 0 },
				default: 0,
				description: 'Sent as page[size]. Use 0 to omit (API default page size).',
				displayOptions: {
					show: {
						operation: QUERY_OPERATIONS,
					},
				},
			},
			{
				displayName: 'Additional Query Parameters',
				name: 'additionalQueryParameters',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				placeholder: 'Add Parameter',
				default: {},
				displayOptions: {
					show: {
						operation: QUERY_OPERATIONS,
					},
				},
				description:
					'Extra query string keys sent as-is (for example filter[status], updated_datetime with a comma-separated range)',
				options: [
					{
						displayName: 'Parameter',
						name: 'queryParameter',
						values: [
							{
								displayName: 'Name',
								name: 'name',
								type: 'string',
								default: '',
								placeholder: 'e.g. filter[status]',
							},
							{
								displayName: 'Value',
								name: 'value',
								type: 'string',
								default: '',
							},
						],
					},
				],
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
				description:
					'JSON request body. Distru upserts often use nested attributes; use expressions where needed.',
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
				displayName: 'Additional Form Fields',
				name: 'additionalFormFields',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: {
						operation: FORM_DATA_OPERATIONS,
					},
				},
				description: 'Other multipart text fields (for example product_id, order_id, name)',
				options: [
					{
						displayName: 'Field',
						name: 'formField',
						values: [
							{
								displayName: 'Name',
								name: 'name',
								type: 'string',
								default: '',
							},
							{
								displayName: 'Value',
								name: 'value',
								type: 'string',
								default: '',
							},
						],
					},
				],
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
					const pageNumber = this.getNodeParameter('pageNumber', i, 0) as number;
					const pageSize = this.getNodeParameter('pageSize', i, 0) as number;
					const additionalQueryParameters = this.getNodeParameter(
						'additionalQueryParameters',
						i,
						{},
					) as { queryParameter?: Array<{ name: string; value: string }> };
					requestOptions.qs = buildQueryFromUi(pageNumber, pageSize, additionalQueryParameters);
				}

				if (config.usesBody) {
					const body = this.getNodeParameter('body', i, {}) as IDataObject;
					requestOptions.body = (removeEmpty(body) as IDataObject) ?? {};
				}

				if (config.usesFormData) {
					const additionalFormFields = this.getNodeParameter('additionalFormFields', i, {}) as {
						formField?: Array<{ name: string; value: string }>;
					};
					const formData = collectFormFields(additionalFormFields);
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