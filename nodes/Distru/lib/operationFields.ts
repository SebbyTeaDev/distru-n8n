import type { INodeProperties } from 'n8n-workflow';

/**
 * Generate field definitions for all operations.
 * Each operation gets specific fields based on API requirements.
 */

// ============================================================================
// HELPER: Common pagination/filter fields for GET operations
// ============================================================================

function getCommonGetFields(operation: string, pageSize = 5000): INodeProperties[] {
	return [
		{
			displayName: 'Additional Fields',
			name: 'additionalFields',
			type: 'collection',
			placeholder: 'Add Field',
			default: {},
			displayOptions: { show: { operation: [operation] } },
			options: [
				{
					displayName: 'Page Number',
					name: 'page_number',
					type: 'number',
					default: 1,
					description: 'Page number for pagination',
				},
				{
					displayName: 'Page Size',
					name: 'page_size',
					type: 'number',
					default: pageSize,
					description: 'Number of items per page',
				},
				{
					displayName: 'Inserted Datetime',
					name: 'inserted_datetime',
					type: 'string',
					default: '',
					description: 'Filter by creation datetime (comma-separated range, e.g. "2024-01-01T00:00:00Z,2024-06-01T00:00:00Z")',
				},
				{
					displayName: 'Updated Datetime',
					name: 'updated_datetime',
					type: 'string',
					default: '',
					description: 'Filter by last modified datetime (comma-separated range)',
				},
			],
		},
	];
}

// ============================================================================
// STOCK ADJUSTMENTS
// ============================================================================

function getAdjustmentsFields(): INodeProperties[] {
	return [
		// GET fields
		...getCommonGetFields('getAdjustments'),

		// POST fields
		{
			displayName: 'Product ID',
			name: 'product_id',
			type: 'string',
			default: '',
			displayOptions: { show: { operation: ['postAdjustment'] } },
			description: 'Product ID (required if batch_id and package_id not provided)',
		},
		{
			displayName: 'Batch ID',
			name: 'batch_id',
			type: 'string',
			default: '',
			displayOptions: { show: { operation: ['postAdjustment'] } },
			description: 'Batch ID (for batch-tracked products)',
		},
		{
			displayName: 'Package ID',
			name: 'package_id',
			type: 'string',
			default: '',
			displayOptions: { show: { operation: ['postAdjustment'] } },
			description: 'Package ID (for package-tracked products)',
		},
		{
			displayName: 'Completion Datetime',
			name: 'completion_datetime',
			type: 'string',
			required: true,
			default: '',
			displayOptions: { show: { operation: ['postAdjustment'] } },
			description: 'ISO 8601 datetime when adjustment was completed (required)',
			placeholder: '2024-01-15T10:30:00Z',
		},
		{
			displayName: 'Reason',
			name: 'reason',
			type: 'string',
			required: true,
			default: '',
			displayOptions: { show: { operation: ['postAdjustment'] } },
			description: 'Reason for adjustment (required), e.g. "Waste", "Theft", "Damaged"',
		},
		{
			displayName: 'Location ID',
			name: 'location_id',
			type: 'string',
			default: '',
			displayOptions: { show: { operation: ['postAdjustment'] } },
			description: 'Location ID (required for non-compliance adjustments)',
		},
		{
			displayName: 'Quantity',
			name: 'quantity',
			type: 'number',
			default: 0,
			displayOptions: { show: { operation: ['postAdjustment'] } },
			description: 'Adjustment quantity (required for non-package tracked products; cannot be set for package-tracked products)',
		},
		{
			displayName: 'Compliance Quantity',
			name: 'compliance_quantity',
			type: 'number',
			default: 0,
			displayOptions: { show: { operation: ['postAdjustment'] } },
			description: 'Quantity in compliance unit type (required for package-tracked products)',
		},
		{
			displayName: 'Additional Fields',
			name: 'additionalFields',
			type: 'collection',
			placeholder: 'Add Field',
			default: {},
			displayOptions: { show: { operation: ['postAdjustment'] } },
			options: [
				{
					displayName: 'Description',
					name: 'description',
					type: 'string',
					default: '',
					description: 'Additional description for the adjustment',
				},
				{
					displayName: 'Owner ID',
					name: 'owner_id',
					type: 'string',
					default: '',
					description: 'Owner user ID',
				},
				{
					displayName: 'Total Cost',
					name: 'total_cost',
					type: 'number',
					default: 0,
					description: 'Total cost of the adjustment',
				},
				{
					displayName: 'Unit Type',
					name: 'unit_type',
					type: 'string',
					default: '',
					description: 'Unit type for the adjustment',
				},
			],
		},
	];
}

// ============================================================================
// ASSEMBLIES
// ============================================================================

function getAssembliesFields(): INodeProperties[] {
	const fields = getCommonGetFields('getAssemblies', 500);
	// Add assembly-specific filters
	fields[0].options?.push(
		{
			displayName: 'Completion Datetime',
			name: 'completion_datetime',
			type: 'string',
			default: '',
			description: 'Filter by completion datetime range',
		},
		{
			displayName: 'Creation Source',
			name: 'creation_source',
			type: 'options',
			options: [
				{ name: 'Manually Created', value: 'MANUALLY_CREATED' },
				{ name: 'Split Package', value: 'SPLIT_PACKAGE' },
				{ name: 'Sales Order', value: 'SALES_ORDER' },
				{ name: 'Lab Testing', value: 'LAB_TESTING' },
			],
			default: 'MANUALLY_CREATED',
			description: 'Filter by creation source',
		},
		{
			displayName: 'License Number',
			name: 'license_number',
			type: 'string',
			default: '',
			description: 'Filter by license number',
		},
	);
	return fields;
}

// ============================================================================
// BATCHES
// ============================================================================

function getBatchesFields(): INodeProperties[] {
	const getFields = getCommonGetFields('getBatches');
	getFields[0].options?.push(
		{
			displayName: 'Batch IDs',
			name: 'batch_ids[]',
			type: 'string',
			typeOptions: { multipleValues: true },
			default: [],
			description: 'Filter by batch IDs',
		},
		{
			displayName: 'Product ID',
			name: 'product_id',
			type: 'string',
			default: '',
			description: 'Filter by product ID',
		},
		{
			displayName: 'Batch Number',
			name: 'batch_number',
			type: 'string',
			default: '',
			description: 'Filter by batch number',
		},
		{
			displayName: 'Deleted',
			name: 'deleted',
			type: 'options',
			options: [
				{ name: 'No (Default)', value: 'no' },
				{ name: 'Only', value: 'only' },
				{ name: 'Include', value: 'include' },
			],
			default: 'no',
			description: 'Include deleted records',
		},
		{
			displayName: 'Include Costs',
			name: 'include_costs',
			type: 'boolean',
			default: false,
			description: 'Whether to include cost fields in response',
		},
	);

	const postFields: INodeProperties[] = [
		{
			displayName: 'Product ID',
			name: 'product_id',
			type: 'string',
			required: true,
			default: '',
			displayOptions: { show: { operation: ['postBatch'] } },
			description: 'Product ID (required)',
		},
		{
			displayName: 'Additional Fields',
			name: 'additionalFields',
			type: 'collection',
			placeholder: 'Add Field',
			default: {},
			displayOptions: { show: { operation: ['postBatch'] } },
			options: [
				{
					displayName: 'Batch Number',
					name: 'batch_number',
					type: 'string',
					default: '',
				},
				{
					displayName: 'Expiration Date',
					name: 'expiration_date',
					type: 'string',
					default: '',
					placeholder: '2024-12-31',
				},
				{
					displayName: 'Manufactured Datetime',
					name: 'manufactured_datetime',
					type: 'string',
					default: '',
					description: 'ISO 8601 manufactured datetime',
					placeholder: '2024-01-15T10:30:00Z',
				},
				{
					displayName: 'Owner ID',
					name: 'owner_id',
					type: 'string',
					default: '',
					description: 'Owner user ID',
				},
				{
					displayName: 'Description',
					name: 'description',
					type: 'string',
					default: '',
				},
			],
		},
	];

	return [...getFields, ...postFields];
}

// ============================================================================
// COMPANIES
// ============================================================================

function getCompaniesFields(): INodeProperties[] {
	const getFields = getCommonGetFields('getCompanies');
	getFields[0].options?.push({
		displayName: 'Deleted',
		name: 'deleted',
		type: 'options',
		options: [
			{ name: 'No (Default)', value: 'no' },
			{ name: 'Only', value: 'only' },
			{ name: 'Include', value: 'include' },
		],
		default: 'no',
		description: 'Include deleted records',
	});

	const upsertFields: INodeProperties[] = [
		{
			displayName: 'Additional Fields',
			name: 'additionalFields',
			type: 'collection',
			placeholder: 'Add Field',
			default: {},
			displayOptions: { show: { operation: ['upsertCompany'] } },
			description: 'All fields are optional. Include ID to update existing company.',
			options: [
				{
					displayName: 'ID',
					name: 'id',
					type: 'string',
					default: '',
					description: 'Company ID (for update)',
				},
				{
					displayName: 'Name',
					name: 'name',
					type: 'string',
					default: '',
					description: 'Company name',
				},
				{
					displayName: 'Category',
					name: 'category',
					type: 'string',
					default: '',
					description: 'Category (e.g. "Retailer")',
				},
				{
					displayName: 'Legal Business Name',
					name: 'legal_business_name',
					type: 'string',
					default: '',
				},
				{
					displayName: 'Default Email',
					name: 'default_email',
					type: 'string',
					default: '',
				},
				{
					displayName: 'Phone Number',
					name: 'phone_number',
					type: 'string',
					default: '',
				},
				{
					displayName: 'Website',
					name: 'website',
					type: 'string',
					default: '',
					description: 'Website URL',
				},
				{
					displayName: 'Owner ID',
					name: 'owner_id',
					type: 'string',
					default: '',
					description: 'Owner user ID',
				},
			],
		},
	];

	return [...getFields, ...upsertFields];
}

// ============================================================================
// CONTACTS
// ============================================================================

function getContactsFields(): INodeProperties[] {
	const getFields = getCommonGetFields('getContacts', 1000);
	getFields[0].options?.push({
		displayName: 'Deleted',
		name: 'deleted',
		type: 'options',
		options: [
			{ name: 'No (Default)', value: 'no' },
			{ name: 'Only', value: 'only' },
			{ name: 'Include', value: 'include' },
		],
		default: 'no',
		description: 'Include deleted records',
	});

	const upsertFields: INodeProperties[] = [
		{
			displayName: 'First Name',
			name: 'first_name',
			type: 'string',
			required: true,
			default: '',
			displayOptions: { show: { operation: ['upsertContact'] } },
			description: 'First name (required)',
		},
		{
			displayName: 'Additional Fields',
			name: 'additionalFields',
			type: 'collection',
			placeholder: 'Add Field',
			default: {},
			displayOptions: { show: { operation: ['upsertContact'] } },
			options: [
				{
					displayName: 'ID',
					name: 'id',
					type: 'string',
					default: '',
					description: 'Contact ID (for update)',
				},
				{
					displayName: 'Last Name',
					name: 'last_name',
					type: 'string',
					default: '',
				},
				{
					displayName: 'Title',
					name: 'title',
					type: 'string',
					default: '',
					description: 'Job title',
				},
				{
					displayName: 'Email',
					name: 'email',
					type: 'string',
					placeholder: 'name@email.com',
					default: '',
					description: 'Email address',
				},
				{
					displayName: 'Phone Number',
					name: 'phone_number',
					type: 'string',
					default: '',
				},
				{
					displayName: 'Company ID',
					name: 'company_id',
					type: 'string',
					default: '',
					description: 'Company relationship ID',
				},
				{
					displayName: 'Owner ID',
					name: 'owner_id',
					type: 'string',
					default: '',
					description: 'Owner user ID',
				},
			],
		},
	];

	return [...getFields, ...upsertFields];
}

// ============================================================================
// CUSTOM FIELDS
// ============================================================================

function getCustomFieldsFields(): INodeProperties[] {
	return [
		{
			displayName: 'Name',
			name: 'name',
			type: 'string',
			required: true,
			default: '',
			displayOptions: { show: { operation: ['postCustomField'] } },
			description: 'Field name (required)',
		},
		{
			displayName: 'Parent Object',
			name: 'parent_object',
			type: 'options',
			required: true,
			options: [
				{ name: 'Batch', value: 'batch' },
				{ name: 'Company', value: 'company' },
				{ name: 'Contact', value: 'contact' },
				{ name: 'Order', value: 'order' },
				{ name: 'Product', value: 'product' },
			],
			default: 'product',
			displayOptions: { show: { operation: ['postCustomField'] } },
			description: 'Parent object type (required)',
		},
		{
			displayName: 'Field Type',
			name: 'field_type',
			type: 'options',
			required: true,
			options: [
				{ name: 'Text', value: 'text' },
				{ name: 'Date', value: 'date' },
				{ name: 'Dropdown', value: 'dropdown' },
				{ name: 'Checkbox', value: 'checkbox' },
			],
			default: 'text',
			displayOptions: { show: { operation: ['postCustomField'] } },
			description: 'Field type (required)',
		},
		{
			displayName: 'Additional Fields',
			name: 'additionalFields',
			type: 'collection',
			placeholder: 'Add Field',
			default: {},
			displayOptions: { show: { operation: ['postCustomField'] } },
			options: [
				{
					displayName: 'Description',
					name: 'description',
					type: 'string',
					default: '',
				},
				{
					displayName: 'Filterable',
					name: 'filterable',
					type: 'boolean',
					default: false,
					description: 'Whether filterable',
				},
				{
					displayName: 'Field Options',
					name: 'field_options',
					type: 'string',
					typeOptions: { multipleValues: true },
					default: [],
					description: 'Options for dropdown/checkbox types',
				},
			],
		},
	];
}

// ============================================================================
// FILE ATTACHMENTS
// ============================================================================

function getFileAttachmentsFields(): INodeProperties[] {
	return [
		{
			displayName: 'Attach To',
			name: 'attachTo',
			type: 'options',
			required: true,
			options: [
				{ name: 'Assembly', value: 'assembly' },
				{ name: 'Batch', value: 'batch' },
				{ name: 'Company', value: 'company' },
				{ name: 'Contact', value: 'contact' },
				{ name: 'Invoice', value: 'invoice' },
				{ name: 'Order', value: 'order' },
				{ name: 'Product', value: 'product' },
				{ name: 'Purchase', value: 'purchase' },
			],
			default: 'product',
			displayOptions: { show: { operation: ['postFileAttachment'] } },
			description: 'Entity type to attach file to',
		},
		{
			displayName: 'Entity ID',
			name: 'entityId',
			type: 'string',
			required: true,
			default: '',
			displayOptions: { show: { operation: ['postFileAttachment'] } },
			description: 'ID of the entity to attach file to',
		},
		{
			displayName: 'Additional Fields',
			name: 'additionalFields',
			type: 'collection',
			placeholder: 'Add Field',
			default: {},
			displayOptions: { show: { operation: ['postFileAttachment'] } },
			options: [
				{
					displayName: 'Name',
					name: 'name',
					type: 'string',
					default: '',
					description: 'Display name (defaults to filename)',
				},
			],
		},
	];
}

// ============================================================================
// INVENTORY
// ============================================================================

function getInventoryFields(): INodeProperties[] {
	return [
		{
			displayName: 'Grouping',
			name: 'grouping',
			type: 'multiOptions',
			required: true,
			options: [
				{ name: 'Product (Required)', value: 'PRODUCT' },
				{ name: 'Location', value: 'LOCATION' },
				{ name: 'Batch Number', value: 'BATCH_NUMBER' },
			],
			default: ['PRODUCT'],
			displayOptions: { show: { operation: ['getInventory'] } },
			description: 'Attributes to group inventory by. PRODUCT required.',
		},
		{
			displayName: 'Additional Fields',
			name: 'additionalFields',
			type: 'collection',
			placeholder: 'Add Field',
			default: {},
			displayOptions: { show: { operation: ['getInventory'] } },
			options: [
				{
					displayName: 'Product IDs',
					name: 'product_ids[]',
					type: 'string',
					typeOptions: { multipleValues: true },
					default: [],
					description: 'Filter by product IDs',
				},
				{
					displayName: 'Location IDs',
					name: 'location_ids[]',
					type: 'string',
					typeOptions: { multipleValues: true },
					default: [],
					description: 'Filter by location IDs',
				},
				{
					displayName: 'Batch IDs',
					name: 'batch_ids[]',
					type: 'string',
					typeOptions: { multipleValues: true },
					default: [],
					description: 'Filter by batch IDs',
				},
				{
					displayName: 'Page Number',
					name: 'page_number',
					type: 'number',
					default: 1,
				},
				{
					displayName: 'Page Size',
					name: 'page_size',
					type: 'number',
					default: 5000,
				},
			],
		},
	];
}

// ============================================================================
// INVOICES
// ============================================================================

function getInvoicesFields(): INodeProperties[] {
	const getFields = getCommonGetFields('getInvoices', 500);
	getFields[0].options?.push(
		{
			displayName: 'Due Datetime',
			name: 'due_datetime',
			type: 'string',
			default: '',
			description: 'Filter by due datetime range',
		},
		{
			displayName: 'Invoice Datetime',
			name: 'invoice_datetime',
			type: 'string',
			default: '',
			description: 'Filter by invoice datetime range',
		},
		{
			displayName: 'Invoice Number',
			name: 'invoice_number',
			type: 'string',
			default: '',
			description: 'Contains match on invoice number',
		},
		{
			displayName: 'Order IDs',
			name: 'order_id[]',
			type: 'string',
			typeOptions: { multipleValues: true },
			default: [],
			description: 'Filter by order IDs',
		},
		{
			displayName: 'Status',
			name: 'status[]',
			type: 'multiOptions',
			options: [
				{ name: 'Not Paid', value: 'Not Paid' },
				{ name: 'Over Paid', value: 'Over Paid' },
				{ name: 'Fully Paid', value: 'Fully Paid' },
				{ name: 'Partially Paid', value: 'Partially Paid' },
			],
			default: [],
			description: 'Filter by status',
		},
	);

	const upsertFields: INodeProperties[] = [
		{
			displayName: 'Order ID',
			name: 'order_id',
			type: 'string',
			required: true,
			default: '',
			displayOptions: { show: { operation: ['upsertInvoice'] } },
			description: 'Associated order ID (required for create)',
		},
		{
			displayName: 'Additional Fields',
			name: 'additionalFields',
			type: 'collection',
			placeholder: 'Add Field',
			default: {},
			displayOptions: { show: { operation: ['upsertInvoice'] } },
			options: [
				{
					displayName: 'ID',
					name: 'id',
					type: 'string',
					default: '',
					description: 'Invoice ID (for update)',
				},
				{
					displayName: 'Invoice Datetime',
					name: 'invoice_datetime',
					type: 'string',
					default: '',
					description: 'Invoice date',
				},
				{
					displayName: 'Due Datetime',
					name: 'due_datetime',
					type: 'string',
					default: '',
					description: 'Due date',
				},
				{
					displayName: 'Billing Location ID',
					name: 'billing_location_id',
					type: 'string',
					default: '',
				},
			],
		},
		{
			displayName: 'Items',
			name: 'items',
			type: 'fixedCollection',
			placeholder: 'Add Item',
			typeOptions: { multipleValues: true },
			displayOptions: { show: { operation: ['upsertInvoice'] } },
			default: {},
			options: [
				{
					displayName: 'Item',
					name: 'item',
					values: [
						{
							displayName: 'Order Item ID',
							name: 'order_item_id',
							type: 'string',
							default: '',
							description: 'Associated Order Item ID',
						},
						{
							displayName: 'Quantity',
							name: 'quantity',
							type: 'number',
							default: 0,
						},
					],
				},
			],
		},
		{
			displayName: 'Charges',
			name: 'charges',
			type: 'fixedCollection',
			placeholder: 'Add Charge',
			typeOptions: { multipleValues: true },
			displayOptions: { show: { operation: ['upsertInvoice'] } },
			default: {},
			options: [
				{
					displayName: 'Charge',
					name: 'charge',
					values: [
						{
							displayName: 'Name',
							name: 'name',
							type: 'string',
							default: '',
							description: 'Charge name',
						},
						{
							displayName: 'Type',
							name: 'type',
							type: 'options',
							options: [
								{ name: 'Charge', value: 'CHARGE' },
								{ name: 'Discount', value: 'DISCOUNT' },
								{ name: 'Tax', value: 'TAX' },
							],
							default: 'CHARGE',
							description: 'Charge type',
						},
						{
							displayName: 'Price',
							name: 'price',
							type: 'number',
							default: 0,
							description: 'Flat price amount',
						},
						{
							displayName: 'Percentage',
							name: 'percentage',
							type: 'number',
							default: 0,
							description: 'Percentage amount',
						},
					],
				},
			],
		},
	];

	const paymentFields: INodeProperties[] = [
		{
			displayName: 'Payment Method ID',
			name: 'payment_method_id',
			type: 'string',
			required: true,
			default: '',
			displayOptions: { show: { operation: ['postInvoicePayment'] } },
			description: 'Payment method ID (required)',
		},
		{
			displayName: 'Amount',
			name: 'amount',
			type: 'number',
			required: true,
			default: 0,
			displayOptions: { show: { operation: ['postInvoicePayment'] } },
			description: 'Payment amount (required)',
		},
		{
			displayName: 'Payment Datetime',
			name: 'payment_datetime',
			type: 'string',
			required: true,
			default: '',
			displayOptions: { show: { operation: ['postInvoicePayment'] } },
			description: 'Payment date (required)',
			placeholder: '2024-01-15T10:30:00Z',
		},
		{
			displayName: 'Description',
			name: 'description',
			type: 'string',
			required: true,
			default: '',
			displayOptions: { show: { operation: ['postInvoicePayment'] } },
			description: 'Description (required)',
		},
		{
			displayName: 'Additional Fields',
			name: 'additionalFields',
			type: 'collection',
			placeholder: 'Add Field',
			default: {},
			displayOptions: { show: { operation: ['postInvoicePayment'] } },
			options: [
				{
					displayName: 'Quickbooks Deposit Account ID',
					name: 'quickbooks_deposit_account_id',
					type: 'string',
					default: '',
					description: 'QB deposit account ID',
				},
				{
					displayName: 'Quickbooks Deposit Account Name',
					name: 'quickbooks_deposit_account_name',
					type: 'string',
					default: '',
					description: 'QB deposit account name',
				},
			],
		},
	];

	return [...getFields, ...upsertFields, ...paymentFields];
}

// ============================================================================
// Simple GET-only resources (just need common pagination fields)
// ============================================================================

function getLocationsFields(): INodeProperties[] {
	return getCommonGetFields('getLocations', 1000);
}

function getPackagesFields(): INodeProperties[] {
	const fields = getCommonGetFields('getPackages', 500);
	return fields;
}

function getPaymentMethodsFields(): INodeProperties[] {
	return getCommonGetFields('getPaymentMethods', 1000);
}

function getStrainsFields(): INodeProperties[] {
	return getCommonGetFields('getStrains');
}

function getUsersFields(): INodeProperties[] {
	return getCommonGetFields('getUsers', 500);
}

// ============================================================================
// ORDERS
// ============================================================================

function getOrdersFields(): INodeProperties[] {
	const getFields = getCommonGetFields('getOrders', 500);
	getFields[0].options?.push(
		{
			displayName: 'Order Datetime',
			name: 'order_datetime',
			type: 'string',
			default: '',
			description: 'Filter by order datetime range',
		},
		{
			displayName: 'Delivery Datetime',
			name: 'delivery_datetime',
			type: 'string',
			default: '',
			description: 'Filter by delivery datetime range',
		},
		{
			displayName: 'Status',
			name: 'status[]',
			type: 'multiOptions',
			options: [
				{ name: 'Canceled', value: 'CANCELED' },
				{ name: 'Completed', value: 'COMPLETED' },
				{ name: 'Delivered', value: 'DELIVERED' },
				{ name: 'Delivering', value: 'DELIVERING' },
				{ name: 'Pending', value: 'PENDING' },
				{ name: 'Processing', value: 'PROCESSING' },
				{ name: 'Ready to Ship', value: 'READY_TO_SHIP' },
			],
			default: [],
			description: 'Filter by status',
		},
	);

	const upsertFields: INodeProperties[] = [
		{
			displayName: 'Company ID',
			name: 'company_id',
			type: 'string',
			required: true,
			default: '',
			displayOptions: { show: { operation: ['upsertOrder'] } },
			description: 'Customer company ID (required for create)',
		},
		{
			displayName: 'Additional Fields',
			name: 'additionalFields',
			type: 'collection',
			placeholder: 'Add Field',
			default: {},
			displayOptions: { show: { operation: ['upsertOrder'] } },
			options: [
				{
					displayName: 'ID',
					name: 'id',
					type: 'string',
					default: '',
					description: 'Order ID (for update)',
				},
				{
					displayName: 'Order Datetime',
					name: 'order_datetime',
					type: 'string',
					default: '',
					description: 'Order date',
				},
				{
					displayName: 'Delivery Datetime',
					name: 'delivery_datetime',
					type: 'string',
					default: '',
					description: 'Delivery date',
				},
				{
					displayName: 'Due Datetime',
					name: 'due_datetime',
					type: 'string',
					default: '',
					description: 'Due date',
				},
				{
					displayName: 'Internal Notes',
					name: 'internal_notes',
					type: 'string',
					default: '',
				},
				{
					displayName: 'Shipping Location ID',
					name: 'shipping_location_id',
					type: 'string',
					default: '',
				},
				{
					displayName: 'Billing Location ID',
					name: 'billing_location_id',
					type: 'string',
					default: '',
				},
			],
		},
		{
			displayName: 'Items',
			name: 'items',
			type: 'fixedCollection',
			placeholder: 'Add Item',
			typeOptions: { multipleValues: true },
			displayOptions: { show: { operation: ['upsertOrder'] } },
			default: {},
			options: [
				{
					displayName: 'Item',
					name: 'item',
					values: [
						{
							displayName: 'Product ID',
							name: 'product_id',
							type: 'string',
							default: '',
						},
						{
							displayName: 'Quantity',
							name: 'quantity',
							type: 'number',
							default: 1,
						},
						{
							displayName: 'Price',
							name: 'price',
							type: 'number',
							default: 0,
							description: 'Price per unit',
						},
						{
							displayName: 'Location ID',
							name: 'location_id',
							type: 'string',
							default: '',
						},
						{
							displayName: 'Batch ID',
							name: 'batch_id',
							type: 'string',
							default: '',
							description: 'Batch ID (for batch-tracked)',
						},
						{
							displayName: 'Package ID',
							name: 'package_id',
							type: 'string',
							default: '',
							description: 'Package ID (for package-tracked)',
						},
					],
				},
			],
		},
		{
			displayName: 'Charges',
			name: 'charges',
			type: 'fixedCollection',
			placeholder: 'Add Charge',
			typeOptions: { multipleValues: true },
			displayOptions: { show: { operation: ['upsertOrder'] } },
			default: {},
			options: [
				{
					displayName: 'Charge',
					name: 'charge',
					values: [
						{
							displayName: 'Name',
							name: 'name',
							type: 'string',
							default: '',
							description: 'Charge name',
						},
						{
							displayName: 'Type',
							name: 'type',
							type: 'options',
							options: [
								{ name: 'Charge', value: 'CHARGE' },
								{ name: 'Discount', value: 'DISCOUNT' },
								{ name: 'Tax', value: 'TAX' },
							],
							default: 'CHARGE',
							description: 'Charge type',
						},
						{
							displayName: 'Price',
							name: 'price',
							type: 'number',
							default: 0,
							description: 'Flat price amount',
						},
						{
							displayName: 'Percentage',
							name: 'percentage',
							type: 'number',
							default: 0,
							description: 'Percentage amount',
						},
					],
				},
			],
		},
	];

	return [...getFields, ...upsertFields];
}

// ============================================================================
// PRODUCTS
// ============================================================================

function getProductsFields(): INodeProperties[] {
	const getFields = getCommonGetFields('getProducts');
	getFields[0].options?.push({
		displayName: 'Deleted',
		name: 'deleted',
		type: 'options',
		options: [
			{ name: 'No (Default)', value: 'no' },
			{ name: 'Only', value: 'only' },
			{ name: 'Include', value: 'include' },
		],
		default: 'no',
		description: 'Include deleted records',
	});

	const upsertFields: INodeProperties[] = [
		{
			displayName: 'Additional Fields',
			name: 'additionalFields',
			type: 'collection',
			placeholder: 'Add Field',
			default: {},
			displayOptions: { show: { operation: ['upsertProduct'] } },
			description: 'All fields are optional. Include ID to update existing product, or Name to create new product.',
			options: [
				{
					displayName: 'ID',
					name: 'id',
					type: 'string',
					default: '',
					description: 'Product ID (for update)',
				},
				{
					displayName: 'Name',
					name: 'name',
					type: 'string',
					default: '',
					description: 'Product name (required for create)',
				},
				{
					displayName: 'SKU',
					name: 'sku',
					type: 'string',
					default: '',
				},
				{
					displayName: 'Description',
					name: 'description',
					type: 'string',
					default: '',
					description: 'Product description',
				},
				{
					displayName: 'Inventory Tracking Method',
					name: 'inventory_tracking_method',
					type: 'options',
					options: [
						{ name: 'Package', value: 'PACKAGE' },
						{ name: 'Batch', value: 'BATCH' },
						{ name: 'Product', value: 'PRODUCT' },
					],
					default: 'PACKAGE',
				},
				{
					displayName: 'Unit Price',
					name: 'unit_price',
					type: 'number',
					default: 0,
				},
				{
					displayName: 'Unit Cost',
					name: 'unit_cost',
					type: 'number',
					default: 0,
				},
				{
					displayName: 'Category ID',
					name: 'category_id',
					type: 'string',
					default: '',
				},
			],
		},
	];

	const imageFields: INodeProperties[] = [
		{
			displayName: 'Images',
			name: 'images',
			type: 'string',
			typeOptions: { multipleValues: true },
			default: [],
			displayOptions: { show: { operation: ['upsertProductImages'] } },
			description: 'Image URLs to associate with product',
		},
	];

	return [...getFields, ...upsertFields, ...imageFields];
}

// ============================================================================
// PRODUCT POS MAPPINGS
// ============================================================================

function getProductPosMappingsFields(): INodeProperties[] {
	const getFields = getCommonGetFields('getProductPosMappings', 1000);

	const upsertFields: INodeProperties[] = [
		{
			displayName: 'Product ID',
			name: 'product_id',
			type: 'string',
			required: true,
			default: '',
			displayOptions: { show: { operation: ['upsertProductPosMapping'] } },
			description: 'Distru product ID (required)',
		},
		{
			displayName: 'Additional Fields',
			name: 'additionalFields',
			type: 'collection',
			placeholder: 'Add Field',
			default: {},
			displayOptions: { show: { operation: ['upsertProductPosMapping'] } },
			options: [
				{
					displayName: 'Blaze Product ID',
					name: 'blaze_product_id',
					type: 'string',
					default: '',
				},
				{
					displayName: 'Blaze Retailer ID',
					name: 'blaze_retailer_id',
					type: 'string',
					default: '',
				},
				{
					displayName: 'Dutchie Product ID',
					name: 'dutchie_product_id',
					type: 'number',
					default: 0,
				},
				{
					displayName: 'Dutchie Retailer ID',
					name: 'dutchie_retailer_id',
					type: 'string',
					default: '',
				},
				{
					displayName: 'Treez Product ID',
					name: 'treez_product_id',
					type: 'string',
					default: '',
				},
				{
					displayName: 'Treez Retailer ID',
					name: 'treez_retailer_id',
					type: 'string',
					default: '',
				},
			],
		},
	];

	return [...getFields, ...upsertFields];
}

// ============================================================================
// PURCHASES
// ============================================================================

function getPurchasesFields(): INodeProperties[] {
	const getFields = getCommonGetFields('getPurchases');
	getFields[0].options?.push({
		displayName: 'Company ID',
		name: 'company_id',
		type: 'string',
		default: '',
		description: 'Filter by supplier company ID',
	});

	const upsertFields: INodeProperties[] = [
		{
			displayName: 'Company ID',
			name: 'company_id',
			type: 'string',
			required: true,
			default: '',
			displayOptions: { show: { operation: ['upsertPurchase'] } },
			description: 'Supplier company ID (required for create)',
		},
		{
			displayName: 'Additional Fields',
			name: 'additionalFields',
			type: 'collection',
			placeholder: 'Add Field',
			default: {},
			displayOptions: { show: { operation: ['upsertPurchase'] } },
			options: [
				{
					displayName: 'ID',
					name: 'id',
					type: 'string',
					default: '',
					description: 'Purchase ID (for update)',
				},
				{
					displayName: 'Order Datetime',
					name: 'order_datetime',
					type: 'string',
					default: '',
					description: 'Order date',
				},
				{
					displayName: 'Due Datetime',
					name: 'due_datetime',
					type: 'string',
					default: '',
					description: 'Due date',
				},
			],
		},
		{
			displayName: 'Items',
			name: 'items',
			type: 'fixedCollection',
			placeholder: 'Add Item',
			typeOptions: { multipleValues: true },
			displayOptions: { show: { operation: ['upsertPurchase'] } },
			default: {},
			options: [
				{
					displayName: 'Item',
					name: 'item',
					values: [
						{
							displayName: 'Product ID',
							name: 'product_id',
							type: 'string',
							default: '',
						},
						{
							displayName: 'Quantity',
							name: 'quantity',
							type: 'number',
							default: 1,
						},
						{
							displayName: 'Price',
							name: 'price',
							type: 'number',
							default: 0,
							description: 'Price per unit',
						},
						{
							displayName: 'Location ID',
							name: 'location_id',
							type: 'string',
							default: '',
						},
						{
							displayName: 'Batch ID',
							name: 'batch_id',
							type: 'string',
							default: '',
						},
					],
				},
			],
		},
		{
			displayName: 'Charges',
			name: 'charges',
			type: 'fixedCollection',
			placeholder: 'Add Charge',
			typeOptions: { multipleValues: true },
			displayOptions: { show: { operation: ['upsertPurchase'] } },
			default: {},
			options: [
				{
					displayName: 'Charge',
					name: 'charge',
					values: [
						{
							displayName: 'Name',
							name: 'name',
							type: 'string',
							default: '',
							description: 'Charge name',
						},
						{
							displayName: 'Type',
							name: 'type',
							type: 'options',
							options: [
								{ name: 'Charge', value: 'CHARGE' },
								{ name: 'Discount', value: 'DISCOUNT' },
								{ name: 'Tax', value: 'TAX' },
							],
							default: 'CHARGE',
							description: 'Charge type',
						},
						{
							displayName: 'Price',
							name: 'price',
							type: 'number',
							default: 0,
							description: 'Flat price amount',
						},
						{
							displayName: 'Percentage',
							name: 'percentage',
							type: 'number',
							default: 0,
							description: 'Percentage amount',
						},
					],
				},
			],
		},
	];

	const paymentFields: INodeProperties[] = [
		{
			displayName: 'Payment Method ID',
			name: 'payment_method_id',
			type: 'string',
			required: true,
			default: '',
			displayOptions: { show: { operation: ['postPurchasePayment'] } },
			description: 'Payment method ID (required)',
		},
		{
			displayName: 'Amount',
			name: 'amount',
			type: 'number',
			required: true,
			default: 0,
			displayOptions: { show: { operation: ['postPurchasePayment'] } },
			description: 'Payment amount (required)',
		},
		{
			displayName: 'Payment Datetime',
			name: 'payment_datetime',
			type: 'string',
			required: true,
			default: '',
			displayOptions: { show: { operation: ['postPurchasePayment'] } },
			description: 'Payment date (required)',
			placeholder: '2024-01-15T10:30:00Z',
		},
		{
			displayName: 'Description',
			name: 'description',
			type: 'string',
			required: true,
			default: '',
			displayOptions: { show: { operation: ['postPurchasePayment'] } },
			description: 'Description (required)',
		},
		{
			displayName: 'Additional Fields',
			name: 'additionalFields',
			type: 'collection',
			placeholder: 'Add Field',
			default: {},
			displayOptions: { show: { operation: ['postPurchasePayment'] } },
			options: [
				{
					displayName: 'Quickbooks Deposit Account ID',
					name: 'quickbooks_deposit_account_id',
					type: 'string',
					default: '',
					description: 'QB deposit account ID',
				},
				{
					displayName: 'Quickbooks Deposit Account Name',
					name: 'quickbooks_deposit_account_name',
					type: 'string',
					default: '',
					description: 'QB deposit account name',
				},
			],
		},
	];

	return [...getFields, ...upsertFields, ...paymentFields];
}

// ============================================================================
// TEST RESULTS
// ============================================================================

function getTestResultsFields(): INodeProperties[] {
	const getFields = getCommonGetFields('getTestResults');

	const upsertFields: INodeProperties[] = [
		{
			displayName: 'Additional Fields',
			name: 'additionalFields',
			type: 'collection',
			placeholder: 'Add Field',
			default: {},
			displayOptions: { show: { operation: ['upsertTestResult'] } },
			description: 'Test result fields (refer to API docs for full schema)',
			options: [
				{
					displayName: 'ID',
					name: 'id',
					type: 'string',
					default: '',
					description: 'Test result ID (for update)',
				},
				{
					displayName: 'Batch ID',
					name: 'batch_id',
					type: 'string',
					default: '',
					description: 'Associated batch ID',
				},
				{
					displayName: 'Lab Name',
					name: 'lab_name',
					type: 'string',
					default: '',
				},
			],
		},
	];

	return [...getFields, ...upsertFields];
}

// ============================================================================
// MAIN EXPORT: Build all operation-specific fields
// ============================================================================

export function buildOperationFields(): INodeProperties[] {
	return [
		...getAdjustmentsFields(),
		...getAssembliesFields(),
		...getBatchesFields(),
		...getCompaniesFields(),
		...getContactsFields(),
		...getCustomFieldsFields(),
		...getFileAttachmentsFields(),
		...getInventoryFields(),
		...getInvoicesFields(),
		...getLocationsFields(),
		...getOrdersFields(),
		...getPackagesFields(),
		...getPaymentMethodsFields(),
		...getProductsFields(),
		...getProductPosMappingsFields(),
		...getPurchasesFields(),
		...getStrainsFields(),
		...getTestResultsFields(),
		...getUsersFields(),
	];
}
