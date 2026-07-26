// Custom YAML parser (zero dependencies, zero external libraries)

function stripQuotes(val) {
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    return val.substring(1, val.length - 1);
  }
  return val;
}

function parseValue(val) {
  if (val.startsWith('[') && val.endsWith(']')) {
    return val.substring(1, val.length - 1).split(',').map(s => s.trim().replace(/^['"]|['"]$/g, ''));
  }
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    return val.substring(1, val.length - 1);
  }
  if (val === 'true') return true;
  if (val === 'false') return false;
  if (!isNaN(val) && val !== '') return Number(val);
  return val;
}

function parseYAML(content) {
  if (!content) return {};
  const lines = content.split(/\r?\n/).map(line => {
    const commentIdx = line.indexOf('#');
    if (commentIdx !== -1) {
      line = line.substring(0, commentIdx);
    }
    return line;
  }).filter(line => line.trim() !== '');

  const parseListItemObject = (valStr, startIdx, parentItemIndent) => {
    const firstColon = valStr.indexOf(':');
    const subKey = valStr.substring(0, firstColon).trim();
    const subRest = valStr.substring(firstColon + 1).trim();

    const itemObj = { [subKey]: parseValue(subRest) };
    let subIdx = startIdx + 1;

    while (subIdx < lines.length) {
      const subLine = lines[subIdx];
      const subIndent = subLine.search(/\S/);
      const subTrimmed = subLine.trim();

      if (subIndent < parentItemIndent || (subIndent === parentItemIndent && subTrimmed.startsWith('-'))) {
        break;
      }

      const subColon = subTrimmed.indexOf(':');
      if (subColon !== -1) {
        const k = subTrimmed.substring(0, subColon).trim();
        const v = subTrimmed.substring(subColon + 1).trim();
        itemObj[k] = parseValue(v);
      }
      subIdx++;
    }
    return [itemObj, subIdx];
  };

  const parseNode = (startIdx, parentIndent) => {
    const obj = {};
    const arr = [];
    let isArr = false;
    let idx = startIdx;

    while (idx < lines.length) {
      const line = lines[idx];
      const indent = line.search(/\S/);
      const trimmed = line.trim();

      if (indent <= parentIndent) {
        break; // Out of scope
      }

      if (trimmed.startsWith('-')) {
        isArr = true;
        const valStr = trimmed.substring(1).trim();

        if (valStr.includes(':')) {
          const [itemObj, nextIdx] = parseListItemObject(valStr, idx, indent);
          arr.push(itemObj);
          idx = nextIdx;
        } else {
          arr.push(stripQuotes(valStr));
          idx++;
        }
      } else {
        const colonIdx = trimmed.indexOf(':');
        if (colonIdx === -1) {
          idx++;
          continue;
        }
        const key = trimmed.substring(0, colonIdx).trim();
        const rest = trimmed.substring(colonIdx + 1).trim();

        if (rest === '') {
          const [subNode, nextIdx] = parseNode(idx + 1, indent);
          obj[key] = subNode;
          idx = nextIdx;
        } else {
          obj[key] = parseValue(rest);
          idx++;
        }
      }
    }

    return [isArr ? arr : obj, idx];
  };

  const [result] = parseNode(0, -1);
  return result;
}

module.exports = {
  parseYAML
};
