import * as _ from 'lodash';

export function createCookie(name,value,days) {
    if (days) {
        var date = new Date();
        date.setTime(date.getTime()+(days*24*60*60*1000));
        var expires = "; expires="+date.toGMTString();
    }
    else var expires = "";
    document.cookie = name+"="+value+expires+"; path=/";
}

export function readCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
}

export function eraseCookie(name) {
    createCookie(name,"",-1);
}

export function parseQuery() {
    var query = {};
    var url = window.location.href;
    var queryString = url.split('?')[1];
    if (!queryString) return query;
    var pairs = (queryString[0] === '?' ? queryString.substr(1) : queryString).split('&');
    for (var i = 0; i < pairs.length; i++) {
        var pair = pairs[i].split('=');
        query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
    }
    return query;
}

export function getQueryParamByName(name, url) {
    if (!url) {
      url = window.location.href;
    }
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

export function getUniprotUrl(uniprotAcc){
  return 'http://www.uniprot.org/uniprot/' + uniprotAcc;
}
export function getPfamDomainUrl(pfamAcc){
  return 'http://pfam.xfam.org/family/' + pfamAcc;
}

export function formatStr(format) {
    var args = Array.prototype.slice.call(arguments, 1);
    return format.replace(/{(\d+)}/g, function(match, number) { 
      return typeof args[number] != 'undefined'
        ? args[number] 
        : match
      ;
    });
}


function _toNewick(n){
  var name = n.level || n.name || 'untitled';
  var length = n.length || 0;
  if (n.children && n.children.length > 0){
    var str = '(' + _.map(n.children,_toNewick).join(',') + ')';
    str += name;
    str += ':'+length;
    return str;
  }
  return name+':'+length;
}

function _deduplicateNodeNames(newick_string){
  var name_capture_regexp = new RegExp("[\)\(,]([^\(\),]*):", "g");
  var matches;
  var duplicate_counts = {};
  while ((matches = name_capture_regexp.exec(newick_string)) !== null){
    if (!duplicate_counts[matches[1]]){
      duplicate_counts[matches[1]] = 1;
    } else{
      duplicate_counts[matches[1]]++;
    }
  }
  var new_newick_str = newick_string;
  for (var dup_name in duplicate_counts){
    if (duplicate_counts[dup_name] > 1){
      var match_regexp;
      var replace_str;
      for (var i = 1; i <= duplicate_counts[dup_name]; i++){
        match_regexp = new RegExp("([\)\(,])(" + dup_name + ")(:)");
        //$1 and $3 are the outer capture groups
        replace_str = "$1" + dup_name + "_" + i + "$3";
        new_newick_str = new_newick_str.replace(match_regexp, replace_str);
      }
    }
  }
  return new_newick_str;
}

export function toNewick(n){
  var newick_string = _toNewick(n) + ';';
  return _deduplicateNodeNames(newick_string);
}

export function downloadAsFile(data,filename){
    var blob = new Blob([data], { type: 'text;charset=utf-8;'});
    var link = document.createElement("a");
    if (link.download !== undefined) { // feature detection
        // Browsers that support HTML5 download attribute
        var url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

export function exportFile(filename, str){
    var blob = new Blob([str], { type: 'text/csv;charset=utf-8;' });
    if (navigator.msSaveBlob) { // IE 10+
        navigator.msSaveBlob(blob, filename);
    } else {
        var link = document.createElement("a");
        if (link.download !== undefined) { // feature detection
            // Browsers that support HTML5 download attribute
            var url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
}

export function exportToCsv(filename, rows) {
    if (!filename.endsWith('.csv')) filename += '.csv';
    var processRow = function (row) {
        var finalVal = '';
        for (var j = 0; j < row.length; j++) {
            var innerValue = row[j] === null ? '' : row[j].toString();
            if (row[j] instanceof Date) {
                innerValue = row[j].toLocaleString();
            };
            var result = innerValue.replace(/"/g, '""');
            if (result.search(/("|,|\n)/g) >= 0)
                result = '"' + result + '"';
            if (j > 0)
                finalVal += ',';
            finalVal += result;
        }
        return finalVal + '\n';
    };

    var csvFile = '';
    for (var i = 0; i < rows.length; i++) {
        csvFile += processRow(rows[i]);
    }
    return exportFile(filename, csvFile);
}

/*========================================
=            UI Related Utils            =
========================================*/

export function moveToFront() {
  this.parentNode.appendChild(this);
}



/*=====  End of UI Related Utils  ======*/


