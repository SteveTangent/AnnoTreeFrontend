export const TREE_LABEL_CLICKED = 'TREE_LABEL_CLICKED';
export const TREE_BACK_BUTTON_CLICKED = 'TREE_BACK_BUTTON_CLICKED';
export const TREE_RESET_BUTTON_CLICKED = 'TREE_RESET_BUTTON_CLICKED';
export const TREE_DOWNLOAD_SVG_CLICKED = 'TREE_DOWNLOAD_SVG_CLICKED';
export const TREE_DOWNLOAD_NEWICK_CLICKED = 'TREE_DOWNLOAD_NEWICK_CLICKED';
export const TREE_INTERNAL_NODE_CLICKED = 'TREE_INTERNAL_NODE_CLICKED';
export const TREE_POP_UP_CLOSE = 'TREE_POP_UP_CLOSE';
export const TREE_RECENTER_CLICKED = 'TREE_RECENTER_CLICKED';
export const TREE_RECENTER_LEVEL_CLICKED = 'TREE_RECENTER_LEVEL_CLICKED';
export const TREE_TYPE_CHANGED = 'TREE_TYPE_CHANGED';
export const TREE_LEVEL_CLICKED = 'TREE_LEVEL_CLICKED';
export const TREE_DOWNLOAD_DETAIL_RESULTS = 'TREE_DOWNLOAD_DETAIL_RESULTS';
export const TREE_DOWNLOAD_QUERY_RESULTS = 'TREE_DOWNLOAD_QUERY_RESULTS';
export const TREE_FONT_SIZE_CHANGED = 'TREE_FONT_SIZE_CHANGED';
export const TREE_NODE_DETAIL_MOVED = 'TREE_NODE_DETAIL_MOVED';
export const TREE_NODE_DETAIL_ON_DRAG_START = 'TREE_NODE_DETAIL_ON_DRAG_START';
export const TREE_NODE_DETAIL_ON_DRAG_END = 'TREE_NODE_DETAIL_ON_DRAG_END';
export const TREE_TOGGLE_COLOR_PICKER = 'TREE_TOGGLE_COLOR_PICKER';
export const TREE_HIGHLIGHT_COLOR_CHANGE = 'TREE_HIGHLIGHT_COLOR_CHANGE';
export const TREE_GROUP_BAND_LEVEL_CHANGED = 'TREE_GROUP_BAND_LEVEL_CHANGED';

export const BACTERIAL_TREE = 'Bacterial';
export const ARCHAEAL_TREE = 'Archaeal';

export const INFERRED_ANCESTOR = 'Inferred Ancestor';
export const GENUS_REP = 'Genus Rep.';
export const CLASS_REP = 'Class Rep.';
export const PHYLUM_REP = 'PHYLUM Rep.';

export const NONE = 'none';
export const GENOMES = 'genomes'; // highest resolution
export const SPECIES = 'species';
export const GENUS = 'genus';
export const FAMILY = 'family';
export const ORDER = 'order';
export const CLASS = 'class';
export const PHYLUM = 'phylum';
export const HIGHEST_RESOLUTION_LEVEL = SPECIES;
// export const AVAILABLE_LEVELS = [PHYLUM, CLASS, ORDER, FAMILY, GENUS, SPECIES];

export const AVAILABLE_LEVELS = [PHYLUM, CLASS, ORDER, FAMILY];
export const AVAILABLE_GROUP_BAND_LEVELS = [NONE, PHYLUM, CLASS, ORDER, FAMILY, GENUS];

// don't display labels beyond this number
export const MAX_LABEL_SHOWN = 2000;

export const RESULT_SIZE_LIMIT = 50;

export const NODE_CONTAINER_WIDTH = 275;

export const INNER_RADIUS = 370;
export const OUTER_RADIUS = 540;


export const PHYLUM_MANUAL_NAMING = {
};

// using genus name for all single lineage eukaryotes
export const PHYLUM_MANUAL_USE_GENUS_NAME = {
};

export const DOMAIN_EUKARYOTA = 'EUKARYOTA';
export const DOMAIN_BACTERIA = 'BACTERIA';
export const DOMAIN_ARCHAEA = 'ARCHAEA';

// each node id in the following list is the ancestral node for all
// nodes belonging to the same domain
// note that there several Archaea nodes, since domain archaea is
// fragmented to many branches
export const DOMAIN_NODES = {
};


