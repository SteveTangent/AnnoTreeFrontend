import * as AppConstant from 'AppConstant';

export const QUERY_TEXT_CHANGED = 'QUERY_TEXT_CHANGED';
export const QUERY_OPTION_CHANGED = 'QUERY_OPTION_CHANGED';
export const QUERY_OPTION_OPENED = 'QUERY_OPTION_OPENED';
export const QUERY_SUGGESTION_CLICKED = 'QUERY_SUGGESTION_CLICKED';
export const QUERY_SUBMITTED = 'QUERY_TEXT_SUBMITTED';
export const FILE_UPLOADED = 'FILE_UPLOADED';
export const KEGG_SEARCH_OPTIONS = [{
		displayName: '% identity',
		name: 'percent_identity',
		defaultVal: 30.0,
		value: 30.0
	},{
		displayName: 'E value',
		name: 'eval',
		defaultVal: 1e-5,
		value: 1e-5
	},{
		displayName: '% subject alignment',
		name: 'subject_percent_alignment',
		defaultVal: 70.0,
		value: 70.0
	},{
		displayName: '% query alignment',
		name: 'query_percent_alignment',
		defaultVal: 70.0,
		value: 70.0
	}];

export const PFAM_SEARCH_OPTIONS = [{
		displayName: 'E value',
		name: 'eval',
		defaultVal: 1,
		value: 1e-5
	}];

export const TIGRFAM_SEARCH_OPTIONS = [{
		displayName: 'E value',
		name: 'eval',
		defaultVal: 1,
		value: 1e-5
	}];


export const SEARCH_OPTIONS = {
	[AppConstant.SEARCH_KEGG]: KEGG_SEARCH_OPTIONS,
	[AppConstant.SEARCH_PFAM]: PFAM_SEARCH_OPTIONS,
	[AppConstant.SEARCH_TIGRFAM]: TIGRFAM_SEARCH_OPTIONS,
};


export const NO_MATCH_SUGGESTION = {
  detail: 'Sorry nothing matched your query',
  displayText: '',
};

