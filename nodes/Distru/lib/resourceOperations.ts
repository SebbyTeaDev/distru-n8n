import type { INodeProperties, INodePropertyOptions } from 'n8n-workflow';

type OpSpec = { name: string; value: string; action: string };

/** Resource key → operations (option name / value / action for picker). */
export const RESOURCE_OPERATIONS: Record<string, OpSpec[]> = {
	adjustments: [
		{ name: 'Get Many', value: 'getAdjustments', action: 'Adjustments get many' },
		{ name: 'Post', value: 'postAdjustment', action: 'Adjustments post' },
	],
	assemblies: [{ name: 'Get Many', value: 'getAssemblies', action: 'Assemblies get many' }],
	batches: [
		{ name: 'Get Many', value: 'getBatches', action: 'Batches get many' },
		{ name: 'Post', value: 'postBatch', action: 'Batches post' },
	],
	companies: [
		{ name: 'Get Many', value: 'getCompanies', action: 'Companies get many' },
		{ name: 'Upsert', value: 'upsertCompany', action: 'Companies upsert' },
	],
	contacts: [
		{ name: 'Get Many', value: 'getContacts', action: 'Contacts get many' },
		{ name: 'Upsert', value: 'upsertContact', action: 'Contacts upsert' },
	],
	customFields: [{ name: 'Post', value: 'postCustomField', action: 'Custom fields post' }],
	fileAttachments: [
		{ name: 'Upload', value: 'postFileAttachment', action: 'File attachments upload' },
	],
	inventory: [{ name: 'Get Many', value: 'getInventory', action: 'Inventory get many' }],
	invoices: [
		{ name: 'Get by ID', value: 'getInvoiceById', action: 'Invoices get by id' },
		{ name: 'Get Many', value: 'getInvoices', action: 'Invoices get many' },
		{ name: 'Post Payment', value: 'postInvoicePayment', action: 'Invoices post payment' },
		{ name: 'Upsert', value: 'upsertInvoice', action: 'Invoices upsert' },
	],
	locations: [{ name: 'Get Many', value: 'getLocations', action: 'Locations get many' }],
	orders: [
		{ name: 'Get by ID', value: 'getOrderById', action: 'Orders get by id' },
		{ name: 'Get Many', value: 'getOrders', action: 'Orders get many' },
		{ name: 'Upsert', value: 'upsertOrder', action: 'Orders upsert' },
	],
	packages: [{ name: 'Get Many', value: 'getPackages', action: 'Packages get many' }],
	paymentMethods: [{ name: 'Get Many', value: 'getPaymentMethods', action: 'Payment methods get many' }],
	productPosMappings: [
		{ name: 'Delete', value: 'deleteProductPosMapping', action: 'Product pos mappings delete' },
		{ name: 'Get Many', value: 'getProductPosMappings', action: 'Product pos mappings get many' },
		{ name: 'Upsert', value: 'upsertProductPosMapping', action: 'Product pos mappings upsert' },
	],
	products: [
		{ name: 'Get Many', value: 'getProducts', action: 'Products get many' },
		{ name: 'Upsert', value: 'upsertProduct', action: 'Products upsert' },
		{ name: 'Upsert Images', value: 'upsertProductImages', action: 'Products upsert images' },
	],
	purchases: [
		{ name: 'Get Many', value: 'getPurchases', action: 'Purchases get many' },
		{ name: 'Post Payment', value: 'postPurchasePayment', action: 'Purchases post payment' },
		{ name: 'Upsert', value: 'upsertPurchase', action: 'Purchases upsert' },
	],
	strains: [{ name: 'Get Many', value: 'getStrains', action: 'Strains get many' }],
	testResults: [
		{ name: 'Get Many', value: 'getTestResults', action: 'Test results get many' },
		{ name: 'Upsert', value: 'upsertTestResult', action: 'Test results upsert' },
	],
	users: [{ name: 'Get Many', value: 'getUsers', action: 'Users get many' }],
};

const RESOURCE_LABELS: Record<string, string> = {
	adjustments: 'Adjustments',
	assemblies: 'Assemblies',
	batches: 'Batches',
	companies: 'Companies',
	contacts: 'Contacts',
	customFields: 'Custom Fields',
	fileAttachments: 'File Attachments',
	inventory: 'Inventory',
	invoices: 'Invoices',
	locations: 'Locations',
	orders: 'Orders',
	packages: 'Packages',
	paymentMethods: 'Payment Methods',
	productPosMappings: 'Product POS Mappings',
	products: 'Products',
	purchases: 'Purchases',
	strains: 'Strains',
	testResults: 'Test Results',
	users: 'Users',
};

function sortOptionsByName(options: OpSpec[]): INodePropertyOptions[] {
	return [...options]
		.sort((a, b) => a.name.localeCompare(b.name))
		.map((o) => ({ name: o.name, value: o.value, action: o.action }));
}

/** One `Operation` field per resource (same parameter name), like n8n’s N8n node. */
export function buildResourceOperationProperties(): INodeProperties[] {
	const keys = Object.keys(RESOURCE_OPERATIONS).sort((a, b) =>
		RESOURCE_LABELS[a].localeCompare(RESOURCE_LABELS[b]),
	);
	return keys.map((resource) => {
		const specs = RESOURCE_OPERATIONS[resource];
		const options = sortOptionsByName(specs);
		const defaultOp = options[0].value as string;
		return {
			displayName: 'Operation',
			name: 'operation',
			type: 'options',
			noDataExpression: true,
			required: true,
			default: defaultOp,
			displayOptions: {
				show: {
					resource: [resource],
				},
			},
			options,
		} satisfies INodeProperties;
	});
}

export const RESOURCE_OPTIONS = Object.keys(RESOURCE_OPERATIONS)
	.sort((a, b) => RESOURCE_LABELS[a].localeCompare(RESOURCE_LABELS[b]))
	.map((value) => ({
		name: RESOURCE_LABELS[value],
		value,
	}));

