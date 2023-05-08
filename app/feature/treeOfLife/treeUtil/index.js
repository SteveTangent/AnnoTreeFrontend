import * as TreeConstant from '../TreeConstant';

export function getBandLevelIndex(bandLevel){
  return _.indexOf(TreeConstant.AVAILABLE_GROUP_BAND_LEVELS, bandLevel);
}

/**
  returns true only if bandLevel is in a higher or equal taxonomy
  than displayLevel
  e.g. bandLevel=order, displayLevel=family, returns true
  in the special case that displayLevelIndex < 0, it means that
  displayLevel is outside of AVAILABLE_GROUP_BAND_LEVELS, and
  surely a lower taxonomy (species, genome)
*/
export function isBandViewAllowed(bandLevel, displayLevel){
  var bandLevelIndex = getBandLevelIndex(bandLevel);
  var displayLevelIndex = getBandLevelIndex(displayLevel);
  return displayLevelIndex < 0 || bandLevelIndex < displayLevelIndex;
}