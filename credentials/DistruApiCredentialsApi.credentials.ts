import {
	ICredentialType,
	INodeProperties,
	IAuthenticateGeneric,
} from 'n8n-workflow';

export class DistruApiCredentialsApi implements ICredentialType {
	name = 'distruApi';
	displayName = 'Distru API';
	documentationUrl = 'https://apidocs.distru.dev';
	properties: INodeProperties[] = [
		{
			displayName: 'API Token',
			name: 'apiToken',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
		},
		{
			displayName: 'Use Staging Environment',
			name: 'useStaging',
			type: 'boolean',
			default: false,
			description: 'Whether to use the staging environment instead of production',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: 'Bearer {{$credentials.apiToken}}',
			},
		},
	};
}