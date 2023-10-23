export const APP_CLICKED = 'APP_CLICKED';

// app and annotation db version info
export const VERSION = 'v2.0.0';
export const GTDB_BAC_VERSION = 'Release R214';
export const GTDB_AR_VERSION = 'Release R214';
export const PFAM_VERSION = 'v27.0';
export const KEGG_VERSION = 'UniRef100: March 6, 2018';
export const TIGRFAM_VERSION = 'v15.0';

// available highlight types
export const SEARCH_TAX = 'tax';
export const SEARCH_PFAM = 'pfam';
export const SEARCH_KEGG = 'kegg';
// export const SEARCH_TIGRFAM = 'tigrfam';
export const SEARCH_TIGRFAM = 'interpro';
export const SEARCH_ALL = 'all'; // special ALL type


export const AVAILABLE_HIGHLIGHTS = [SEARCH_TAX, SEARCH_PFAM, SEARCH_KEGG, SEARCH_TIGRFAM];
// CSS classes in `treeStyle.less` that specifies color of highlighting
export const HIGHLIGHT_CLASSES = {
	[SEARCH_TAX]: 'taxHighlighted',
	[SEARCH_PFAM]: 'pfamHighlighted',
  [SEARCH_KEGG]: 'keggHighlighted',
	[SEARCH_TIGRFAM]: 'tigrfamHighlighted',
};

const pfamOption = {
  displayText: 'Pfam',
  placeholder: 'Searching for genomes containing ALL of given families',
};

const taxOption = {
  displayText: 'Taxonomy',
  placeholder: 'Enter NCBI species ids, or search by species name'
};

const keggOption = {
  displayText: 'KEGG',
  placeholder: 'Enter a comma separated KO number'
};

const tigrfamOption = {
  displayText: 'TIGRFAM',
  // displayText: 'InterPro',
  placeholder: 'Searching for genomes containing ALL of given families'
};

export const QUERY_BOX_OPTIONS = {
  [SEARCH_TAX]: taxOption,
  [SEARCH_PFAM]: pfamOption,
  [SEARCH_KEGG]: keggOption,
  [SEARCH_TIGRFAM]: tigrfamOption,
};
