// Custom YAML parser (zero dependencies, zero external libraries)
function parseYAML(content) {
  if (!content) return {};
  const lines = content.split(/\r?\n/).map(line => {
    const commentIdx = line.indexOf('#');
    if (commentIdx !== -1) {
      line = line.substring(0, commentIdx);
    }
    return line;
  }).filter(line => line.trim() !== '');

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
          const firstColon = valStr.indexOf(':');
          const subKey = valStr.substring(0, firstColon).trim();
          const subRest = valStr.substring(firstColon + 1).trim();

          let parsedVal = subRest;
          if (parsedVal.startsWith('[') && parsedVal.endsWith(']')) {
            parsedVal = parsedVal.substring(1, parsedVal.length - 1).split(',').map(s => s.trim().replace(/^['"]|['"]$/g, ''));
          } else if ((parsedVal.startsWith('"') && parsedVal.endsWith('"')) || (parsedVal.startsWith("'") && parsedVal.endsWith("'"))) {
            parsedVal = parsedVal.substring(1, parsedVal.length - 1);
          } else if (parsedVal === 'true') {
            parsedVal = true;
          } else if (parsedVal === 'false') {
            parsedVal = false;
          } else if (!isNaN(parsedVal) && parsedVal !== '') {
            parsedVal = Number(parsedVal);
          }

          const itemObj = { [subKey]: parsedVal };
          let subIdx = idx + 1;
          while (subIdx < lines.length) {
            const subLine = lines[subIdx];
            const subIndent = subLine.search(/\S/);
            const subTrimmed = subLine.trim();

            if (subIndent < indent || (subIndent === indent && subTrimmed.startsWith('-'))) {
              break;
            }

            const subColon = subTrimmed.indexOf(':');
            if (subColon !== -1) {
              const k = subTrimmed.substring(0, subColon).trim();
              let v = subTrimmed.substring(subColon + 1).trim();
              if (v.startsWith('[') && v.endsWith(']')) {
                v = v.substring(1, v.length - 1).split(',').map(s => s.trim().replace(/^['"]|['"]$/g, ''));
              } else if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
                v = v.substring(1, v.length - 1);
              } else if (v === 'true') {
                v = true;
              } else if (v === 'false') {
                v = false;
              } else if (!isNaN(v) && v !== '') {
                v = Number(v);
              }
              itemObj[k] = v;
            }
            subIdx++;
          }
          arr.push(itemObj);
          idx = subIdx;
        } else {
          let val = valStr;
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.substring(1, val.length - 1);
          }
          arr.push(val);
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
          let val = rest;
          if (val.startsWith('[') && val.endsWith(']')) {
            val = val.substring(1, val.length - 1).split(',').map(s => s.trim().replace(/^['"]|['"]$/g, ''));
          } else {
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
              val = val.substring(1, val.length - 1);
            } else if (val === 'true') {
              val = true;
            } else if (val === 'false') {
              val = false;
            } else if (!isNaN(val) && val !== '') {
              val = Number(val);
            }
          }
          obj[key] = val;
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
