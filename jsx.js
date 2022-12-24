window.jsx = ([...strings], ...inputs) => {
  const elements = [];
  const div = document.createElement("div");
  div.innerHTML = strings.map((string, i) => {
    if(i == 0) return string;
    let input = inputs[i - 1];

    if(input instanceof Array) {
      input = jsx.collect(input);
    }
    if(input instanceof Element || input instanceof DocumentFragment) {
      elements.push(input);
      input = `<jsxplaceholder id="${elements.length - 1}"></jsxplaceholder>`;
    }
    if(input instanceof Function) {
      jsx.functions.push(input);
      input = `"jsx.functions[${jsx.functions.length - 1}].call(this, event)"`;
    }

    return input + string;
  }).join("");

  jsx.filterChildren(div);

  if(div.children.length > 1) return jsx.collect(div.children);
  return div.children[0];
}

jsx.filterChildren = parent => {
  if(!parent?.children) return;
  [...parent.children].forEach(child => {
    const attributeNames = child.getAttributeNames();

    if(child.nodeName == "JSXPLACEHOLDER") {
      child.replaceWith(elements[Number(child.id)]);
    }

    const cel = jsx.registry[child.nodeName];
    if(cel) {
      const newChild = cel.call(child, jsx.attributesToObject(child));
      child.getAttributeNames().forEach(name => newChild.setAttribute(name, child.getAttribute(name)));
      child.replaceWith(newChild);
      child = newChild;
    }

    attributeNames.forEach(name => {
      const [label, content] = name.split(":");
      if(content) {
        if(label == "var") {
          window[content] = child;
        } else if(label == "let") {
          (function addVariable(parent) {
            parent[content] = child;
            [...parent.children].forEach(child => addVariable(child));
          })(div);
        } else if(label == "data") {
          let data = child.getAttribute(name);
          try { data = JSON.parse(data) } catch(e) {}
          child[content] = data;
        }
        if(child.hasAttribute(name)) child.removeAttribute(name);
      }
    });

    jsx.filterChildren(child);
  });
}

jsx.script = document.currentScript;

jsx.import = async src => {
  const js = await fetch(src).then(res => res.text());
  return await import(`data:text/javascript;base64,${btoa(jsx.parse(js))}`);
}

jsx.registry = {
  "JSX:COLLECTION"() {
    jsx.filterChildren(this);
    return jsx.collect(this.children);
  }
};
jsx.functions = [];

jsx.collect = elements => {
  const fragment = document.createDocumentFragment();
  fragment.append(...elements);
  return fragment;
}

jsx.attributesToObject = element => {
  return element.getAttributeNames().reduce((attrs, name) => {
    let attr = element.getAttribute(name);
    if(attr.startsWith("jsx.functions")) attr = new Function("event", "return " + attr);
    return {
      ...attrs,
      [name]: attr || true
    }
  }, {});
}

jsx.parse = script => {
  const stack = [{ type: null }];
  let esc = false;
  return [...script].reduce((result, char, i, chars) => {
    const top = stack.at(-1);

    if(esc) {
      esc = false;
      return result + char;
    }

    if(char == "\\" && top.type != "html") {
      esc = true;
      return result + char;
    }

    if(top.type == "string") {
      if(char == top.string) {
        stack.pop();
      }

      if(char == "{" && top.string == "`" && chars[i - 1] == "$") {
        stack.push({ type: null });
      }

      // STRINGSTOP
      return result + char;
    }

    if(char == "{") {
      if(top.type == "html" || top.type == "element") {
        char = "${";
      }
      stack.push({ type: null });
    }
    if(char == "}") stack.pop();

    if(char == "<" && (result.match(/(^|[^\w]|return)[ \r\n]*$/) || top.type == "html")) {
      if(top.type != "html") {
        char = "jsx`" + char;
      }
      stack.push({
        type: "element",
        named: false,
        name: "",
        closeTested: false
      });
    }

    if(top.type == "html") {
      if(char == "\\") char = "\\\\";
      if(char == "`") char = "\\`";

      // HTMLSTOP
      return result + char;
    }

    if(top.type == "element") {
      if(!top.closeTested) {
        if(char == "/") {
          top.close = true;
          return result + char;
        }
        top.closeTested = true;
      }

      if(!top.named) {
        if(char.match(/\w/)) {
          top.name += char;
        } else {
          top.named = true;
          if(top.name.match(/^[A-Z]/) && !top.close) {
            result = result.replace(/(\w+)$/, `\${(jsx.registry.${top.name.toUpperCase()}=$1,"$1")}`);
          }
          if(!top.name) {
            result += "jsx:collection";
          }
        }
      }

      if(char == ">") {
        stack.pop();
        if(result.endsWith("/") || top.close) {
          if(top.close) {
            stack.pop();
          }
          if(stack.at(-1).type != "html") {
            char += "`";
          }
        } else {
          stack.push({
            type: "html"
          })
        }
      }

      // ELEMENTSTOP
      return result + char;
    }

    if(char == "'" || char == '"' || char == "`") {
      stack.push({
        type: "string",
        string: char
      });
    }

    return result + char;
  }, "")
  .replace(/^ *(import)( *\w* *)?(, *)?{?(.*?)}?( *from *)?(".+?")/gm, (_match, _import, def, _comma, obj, _from, src) => 
    `let {${def.trim() ? `default: ${def}` : ""}${def.trim() && obj ? "," : ""}${obj}} = await jsx.import(${src})`
  );
}

new MutationObserver(mutations => {
  for(const { addedNodes } of mutations) {
    for(const node of addedNodes) {
      if(node.nodeName == "SCRIPT" && node.hasAttribute("jsx") && node.getAttribute("jsx") != "compiled") {
        if(node.innerHTML.match(/^ *import/gm)) node.setAttribute("async", "");
        if(node.src) {
          fetch(node.src).then(res => res.text()).then(content => {
            node.innerHTML = jsx.parse(content);
            const script = document.createElement("script");
            node.replaceWith(script);
            script.replaceWith(node);
            node.setAttribute("jsx", "compiled");
          });
          node.removeAttribute("src");
          return;
        }
        node.innerHTML = jsx.parse(node.innerHTML);
        node.setAttribute("jsx", "compiled");
      }
    }
  }
}).observe(document, { subtree: true, childList: true });