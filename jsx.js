new MutationObserver(async (mutations) => {
  for (const { addedNodes } of mutations) {
    for (const node of addedNodes) {
      JSX.applySpecial(node);
      if (
        typeof node.getAttribute?.("jsx") == "string" &&
        node.getAttribute?.("jsx") != "compiled"
      ) {
        const parent = node.parentElement;
        const script = document.createElement("script");
        script.setAttribute("jsx", "compiled");
        parent.replaceChild(script, node);
        let js;
        if (!node.src) {
          js = node.innerHTML;
        } else {
          js = await new Promise((resolve) => {
            const xhr = new XMLHttpRequest();
            xhr.onload = () => resolve(xhr.response);
            xhr.open("GET", node.src);
            xhr.send();
          });
        }
        const tokens = js
          .replace(/>/g, ">>")
          .split(
            /([\(|\[|\&|=|>|:|,]|return)([ \r\n]*)(<.*?>)|(<\/.*?>)|([\{\}])/gs
          )
          .filter((a) => a)
          .map((text) => ({
            text,
            type: text.match(/^<[^\/].*?>|^<>/s)
              ? "node"
              : text.match(/^<\/.*?>/s)
              ? "node-end"
              : "text",
            full: !!text.match(/\/>$/s),
          }));
        let depth = 0;
        let brackets = [];
        tokens.forEach((token, i) => {
          const { type, text } = token;
          token.text = token.text.replace(/^>/, "");
          token.text = token.text.replace(/>>/g, ">");
          if (type != "node" && type != "node-end") {
            if (depth && token.text.match(/\{/)) {
              token.text = token.text.replace(/\{/g, "${");
              brackets[0] = true;
              return;
            }
            if (depth && token.text.match(/\}/)) {
              brackets[0] = false;
              return;
            }
            return;
          }
          if (type == "node") {
            const [name, ending] = text
              .match(/< *(.+?)[\n >] *(.*?)$/s)
              ?.slice(1) ?? ["", ""];
            const attributes = ending
              .match(
                / *[^ ]+? *= *["{].+?[}"]| *[^ ]+? *= *[^"{].*?[ >]| *[^ ]+?[ >]/g
              )
              ?.map((text) => {
                const [name, value] =
                  / *(.+?) *= *["{](.+?)[}"]| *(.+?) *= *([^"{].*?)[ >]| *([^ ]+?)(>|$)/
                    .exec(text.replace(/[\r\n ]*\/?>?$/g, ""))
                    ?.slice(1)
                    .filter((a) => a) ?? ["", ""];
                const type = text.match(/= *\{/)
                  ? "code"
                  : text.match(/= *"|=/)
                  ? "string"
                  : "empty";
                return { name, value, type };
              })
              .filter(({ name }) => name);
            token.text = `${
              depth && !brackets[0] ? "`," : ""
            }JSX.createElement(${
              name
                ? name[0].toLowerCase() != name[0]
                  ? name
                  : `"${name}"`
                : "JSX.Collection"
            },{`;
            attributes?.forEach(({ name, value, type }, i) => {
              if (i > 0) token.text += ",";
              token.text += `${name}:`;
              if (type == "code") token.text += value;
              if (type == "string") token.text += `"${value}"`;
              if (type == "empty") token.text += '""';
            });
            depth++;
            brackets.unshift(false);
            token.text += `}${
              token.full
                ? (--depth,
                  brackets.shift(),
                  `)${depth && !brackets[0] ? ",JSX.parseInnerHTML`" : ""}`)
                : ",JSX.parseInnerHTML`"
            }`;
            return;
          }
          if (type == "node-end") {
            depth--;
            brackets.shift();
            token.text = `\`)${
              depth && !brackets[0] ? ",JSX.parseInnerHTML`" : ""
            }`;
          }
        });
        script.innerHTML = tokens.map(({ text }) => text).join("");
      }
    }
  }
}).observe(document, {
  subtree: true,
  childList: true,
});
window.JSX = {
  NodeGroup: class NodeGroup {
    constructor(children) {
      this.children = children;
    }
  },
  collectionToFragment(child, element) {
    if (child instanceof Array || child instanceof HTMLCollection) {
      const fragment = document.createDocumentFragment();
      [...child].forEach((c) => JSX.collectionToFragment(c, fragment));
      element.append(fragment);
      return element;
    }
    element.append(child);
    return element;
  },
  applySpecial(element) {
    if (element) {
      element.collect = (collection) => {
        element.append(
          JSX.collectionToFragment(
            collection,
            document.createDocumentFragment()
          )
        );
      };
      return element;
    }
  },
  createElement(element, attributes, ...children) {
    let f;
    if (typeof element == "function") {
      f = element;
      element = document.createElement(f.name);
    } else {
      element = document.createElement(element);
    }
    for (const name of Object.keys(attributes))
      element.setAttribute(name, attributes[name]);
    element = JSX.applySpecial(JSX.collectionToFragment(children, element));
    if (f?.prototype instanceof JSX.Component) {
      f = new f();
      const value = JSX.applySpecial(f.render.apply(element, [attributes]));
      return value
        ? value instanceof JSX.NodeGroup
          ? value.children
          : value
        : element;
    }
    const value = JSX.applySpecial(f?.apply?.(element, [attributes]));
    return value
      ? value instanceof JSX.NodeGroup
        ? value.children
        : value
      : element;
  },
  Collection: function () {
    return new JSX.NodeGroup(this.children);
  },
  Component: class Component {},
  parseInnerHTML([...text], ...insert) {
    const elements = [];
    insert.forEach((value, i) => {
      if (
        value instanceof HTMLElement ||
        value instanceof Array ||
        value instanceof HTMLCollection
      ) {
        text[i] += "<JSXPlaceholderElement></JSXPlaceholderElement>";
        elements.push(insert);
        return;
      }
      text[i] += value;
    });
    const div = document.createElement("div");
    div.innerHTML = text.join("");
    const replaceChildren = (node) => {
      if (node.tagName == "JSXPLACEHOLDERELEMENT") {
        if (
          elements[0] instanceof Array ||
          elements[0] instanceof HTMLCollection
        ) {
          elements[0] = JSX.collectionToFragment(
            elements[0],
            document.createDocumentFragment()
          );
        }
        node.parentElement.replaceChild(elements.shift(), node);
        return;
      }
      if (node.children) {
        [...node.children].forEach((child) => replaceChildren(child));
      }
    };
    replaceChildren(div);
    return div.children.length ? div.children : div.innerHTML;
  },
};
JSX.applySpecial(document.head);
