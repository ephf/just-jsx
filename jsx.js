new MutationObserver(async (mutations) => {
  for (const { addedNodes } of mutations) {
    for (const node of addedNodes) {
      if (
        typeof node.getAttribute?.("jsx") == "string" &&
        node.getAttribute?.("jsx") != "compiled"
      ) {
        const parent = node.parentElement;
        const script = document.createElement("script");
        script.setAttribute("jsx", "compiled");
        parent.replaceChild(script, node);
        let js;
        if (node.innerHTML) {
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
          .split(/([\(|\[|\&|=|>|:|,][ \r\n]*)(<.+?>)|(<\/.+?>)/g)
          .filter((a) => a)
          .map((text) => ({
            text,
            type: text.match(/^<[^\/].*?>/)
              ? "node"
              : text.match(/^<\/.+?>/)
              ? "node-end"
              : "text",
          }));
        let depth = 0;
        tokens.forEach((token, i) => {
          const { type, text } = token;
          token.text = token.text.replace(/^>/, "");
          token.text = token.text.replace(/>>/g, ">");
          if (type != "node" && type != "node-end") {
            if (depth) {
              token.text = token.text.replace(/\{/g, "${");
            }
            return;
          }
          if (type == "node") {
            const [name, ending] = text.match(/< *(.+?)[ >] *(.*?)$/).slice(1);
            const attributes = ending
              .match(
                / *[^ ]+? *= *["{].+?[}"]| *[^ ]+? *= *[^"{].*?[ >]| *[^ ]+?[ >]/g
              )
              ?.map((text) => {
                const [name, value] =
                  / *(.+?) *= *["{](.+?)[}"]| *(.+?) *= *([^"{].*?)[ >]| *(.+?)(>|$)/
                    .exec(text)
                    .slice(1)
                    .filter((a) => a);
                const type = text.match(/= *\{/)
                  ? "code"
                  : text.match(/= *"|=/)
                  ? "string"
                  : "empty";
                return { name, value, type };
              });
            token.text = `${depth ? "`," : ""}JSX.createElement(${
              name[0].toLowerCase() != name[0] ? name : `"${name}"`
            },{`;
            attributes?.forEach(({ name, value, type }, i) => {
              if (i > 0) token.text += ",";
              token.text += `${name}:`;
              if (type == "code") token.text += value;
              if (type == "string") token.text += `"${value}"`;
              if (type == "empty") token.text += '""';
            });
            token.text += "},`";
            depth++;
            return;
          }
          if (type == "node-end") {
            depth--;
            token.text = `\`)${depth ? ",`" : ""}`;
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
    for (const child of children) element.append(child);
    const value = f?.apply(element, [attributes]);
    return value instanceof this.NodeGroup ? value.children : element;
  },
  Collection: function () {
    return new JSX.NodeGroup(this.children);
  },
};
