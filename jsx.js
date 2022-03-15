window.JSX = {
  Syntax: {
    StringList: class JSXStringList extends Array {},
    TemplateList: class JSXTemplateList extends Array {},
    ElementList: class JSXElementList extends Array {},
    templateParts(template) {
      const parts = [""];
      let depth = 0;
      [...template].forEach((char, i, s) => {
        if (char == "$" && s[i - 1] != "\\") {
          parts[0] += "$";
          parts.unshift("");
          return;
        }
        if (char == "{") {
          depth++;
          if (!parts[0]) {
            parts[1] += "{";
            return;
          }
        }
        if (char == "}") {
          depth--;
          if (depth <= 0) {
            parts.unshift("}");
            return;
          }
        }
        parts[0] += char;
      });
      return new this.TemplateList(
        ...parts.reverse().reduce((a, b, i) => {
          if (!(i % 2))
            return [
              ...a,
              {
                text: b,
                string: true,
                template: true,
              },
            ];
          return [...a, ...this.strings(b)];
        }, [])
      );
    },
    strings(string) {
      return new this.StringList(
        ...string
          .split(/(".*?(?<!\\)")|('.*?(?<!\\)')|(`[^`]*?(?<!\\)`)/g)
          .filter((a) => a)
          .reduce((a, b, i) => {
            if (!(i % 2))
              return [
                ...a,
                {
                  text: b,
                  string: false,
                  template: false,
                },
              ];
            if (b[0] == "`") return [...a, ...this.templateParts(b)];
            return [
              ...a,
              {
                text: b,
                string: true,
                template: false,
              },
            ];
          }, [])
      );
    },
    elements(stringList) {
      if (!(stringList instanceof this.StringList)) return null;
      const parts = [""];
      let depth = 0;
      let possible = true;
      let embedDepth = 0;
      let embed = "";
      stringList.forEach(({ text, string }) => {
        if (embedDepth <= 0 && embed) {
          parts.unshift(
            "",
            "}",
            ...this.elements(this.strings(embed))
              .map(({ text }) => text)
              .reverse(),
            "{"
          );
          embed = "";
        }
        if (string) {
          if (embed) {
            embed += text;
            return;
          }
          parts.unshift("", text);
          if (depth <= 0) possible = false;
          return;
        }
        [...text].forEach((char, i, s) => {
          if (char == "{") {
            embedDepth++;
            if (embedDepth == 1) {
              embed += " ";
              return;
            }
          }
          if (char == "}") {
            embedDepth--;
            if (embedDepth <= 0 && embed) {
              parts.unshift("", "}", this.compile(embed), "{");
              embed = "";
              return;
            }
          }
          if (embedDepth > 0) {
            embed += char;
            return;
          }
          if (char == "<") {
            if (s[i + 1] == "/") {
              depth--;
            }
            if (possible) {
              depth++;
              parts.unshift("<");
              return;
            }
          }
          if (char == ">" && depth > 0) {
            parts[0] += ">";
            parts.unshift("");
            if (s[i - 1] == "/") {
              depth--;
            }
            return;
          }
          if (
            char.match(/[~!%^&*(-+=[|:;,>?]/) ||
            parts[0].match(/return *$/)
          ) {
            possible = true;
          } else if (!char.match(/[\r\n ]/) && depth <= 0) {
            possible = false;
          }
          parts[0] += char;
        });
      });
      let foundFoot = true;
      let inEmbed = 0;
      let nodeDepth = 0;
      return new this.ElementList(
        ...parts
          .reverse()
          .filter((a) => a)
          .map((text) => ({
            text,
            node: (() => {
              if (
                text.match(/^</) &&
                ((foundFoot = false), true) &&
                !text.match(/^<\//)
              ) {
                nodeDepth++;
                return true;
              }
              return false;
            })(),
            end: (() => {
              if (text.match(/^<\//)) {
                nodeDepth--;
                return true;
              }
              if (text.match(/\/>$/)) {
                nodeDepth--;
                return 2;
              }
              return false;
            })(),
            nodeDepth,
            included: !foundFoot,
            foot: !!(text.match(/>$/) && (foundFoot = true)),
            string: !!text.match(/^['"`]/),
            embed:
              nodeDepth > 0
                ? (text == "{" && inEmbed == 0) || (text == "}" && inEmbed == 1)
                : false,
            inEmbed:
              nodeDepth > 0
                ? (text == "{" && (inEmbed += 1),
                  text == "}" ? ((inEmbed -= 1), true) : !!inEmbed)
                : false,
          }))
      );
    },
    elementsToScript(elements) {
      if (!(elements instanceof this.ElementList)) return null;
      let out = "";
      let attrs = 0;
      elements.forEach(
        (
          {
            text,
            node,
            end,
            foot,
            included,
            string,
            embed,
            inEmbed,
            nodeDepth,
          },
          i,
          e
        ) => {
          if (included) {
            if (!string && !inEmbed) {
              if (!e[i - 1]?.included && end !== true) {
                const name = text.match(/<(.*?)[ \n\r\/>]/)[1];
                out += `${
                  nodeDepth + (end || 1) - 1 > 1 ? "," : ""
                }JSX.createElement([${
                  name
                    ? name[0].toLowerCase() != name[0]
                      ? name.replace(/:.+?$/, "")
                      : `"${name.replace(/:.+?$/, "")}"`
                    : "JSX.Collection"
                }${
                  name.match(/:.+?$/)
                    ? `,"${name.match(/:(.+?)$/)[1]}"`
                    : ",null"
                }${nodeDepth + (end || 1) - 1 <= 1 ? ",true" : ",false"}],{`;
              }
              const attributes = text
                .match(/[\r\n ](.*?)\/?>?$/)?.[1]
                .split(" ")
                .map((attr) => attr.replace(/=/g, ""));
              attributes?.forEach((attr, i, a) => {
                if (attr) {
                  out += `${attrs > 0 ? "," : ""}${attr}:${
                    a.length - 1 != i || text.match(/[\r\n ](.*?)>/)
                      ? "true"
                      : ""
                  }`;
                  attrs++;
                }
              });
              if (end && !node) {
                out += `${end === 2 ? "}" : ""})`;
                attrs = 0;
                return;
              }
            }
            if (foot) {
              out += "}";
            }
            if (end) {
              out += ")";
              attrs = 0;
            }
            if (string) {
              out += text;
              return;
            }
            if (inEmbed) {
              if (embed) {
                out += text.replace(/{/, "(").replace(/}/, ")");
                return;
              }
              out += text;
              return;
            }
            return;
          }
          if (inEmbed && nodeDepth > 0) {
            if (embed) {
              if (text == "{") {
                out += `${nodeDepth > 0 ? "," : ""}(`;
              } else {
                out += ")";
              }
              return;
            }
            out += text;
            return;
          }
          if (!text.replace(/[\n\r]/g, "")) return;
          if (string) {
            out += `${nodeDepth > 0 ? "," : ""}${text}`;
            return;
          }
          out += `${nodeDepth > 0 ? ',"' : ""}${
            nodeDepth > 0 ? text.replace(/[\n\r]/g, "") : text
          }${nodeDepth > 0 ? '"' : ""}`;
        }
      );
      return out;
    },
    compile(jsx, module) {
      let js = this.elementsToScript(this.elements(this.strings(jsx)));
      if (module) {
        js = js
          .replace(
            /^ *import *(.*?),? *\{(.+?)\} *from *['"](.+?)['"]/gm,
            'let [$1,{$2}]=await JSX.import("$3")'
          )
          .replace(
            /^ *import *(.+?)  *from *['"](.+?)['"]/gm,
            'let [$1]=await JSX.import("$2")'
          )
          .replace(/^ *import *['"](.+?)['"]/gm, 'await JSX.import("$1")');
      }
      return js;
    },
  },
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
  createElement([element, hook, parent], attributes, ...children) {
    let f;
    if (typeof element == "function") {
      f = element;
      element = document.createElement(f.name);
    } else {
      element = document.createElement(element);
    }
    for (const name of Object.keys(attributes)) {
      if (typeof attributes[name] == "function") {
        element[name] = attributes[name];
        continue;
      }
      element.setAttribute(name, attributes[name]);
    }
    element = JSX.applySpecial(JSX.collectionToFragment(children, element));
    const applyHookKey = (element) => {
      if (element) {
        element.JSX = {};
        element.JSX.hook = hook;
      }
    };
    const applyHook = (element, hooks) => {
      if (element) {
        const givenHooks = !!hooks;
        hooks ??= { parent: element };
        if (element.JSX.hook) {
          hooks[element.JSX.hook] = element;
        }
        [...(element.children ?? [])].forEach((child) => {
          applyHook(child, hooks);
        });
        if (!givenHooks) {
          const giveHooks = ({ children }) => {
            [...(children ?? [])].forEach((child) => {
              child.hooks = hooks;
              giveHooks(child);
            });
          };
          element.hooks = hooks;
          giveHooks(element);
        }
      }
    };
    applyHookKey(element);
    if (parent) applyHook(element);
    if (f?.prototype instanceof JSX.Component) {
      f = new f(attributes);
      const value = JSX.applySpecial(f.render(attributes));
      applyHookKey(value);
      if (parent) applyHook(value);
      Object.entries((value ?? element).hooks).forEach(([hook, element]) => {
        f[hook] = element;
      });
      return value
        ? value instanceof JSX.NodeGroup
          ? value.children
          : value
        : element;
    }
    const value = JSX.applySpecial(f?.apply?.(element, [attributes]));
    applyHookKey(value);
    if (parent) applyHook(value);
    return value
      ? value instanceof JSX.NodeGroup
        ? value.children
        : value
      : element;
  },
  Collection: function () {
    return new JSX.NodeGroup(this.children);
  },
  Component: class Component {
    hooks = {};
    constructor(props) {
      this.props = props;
    }
  },
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
  async import(url) {
    const js = await new Promise((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = () => resolve(xhr.response);
      xhr.open("GET", url);
      xhr.send();
    });
    const module = `data:text/javascript;base64,${btoa(
      JSX.Syntax.compile(js, true)
    )}`;
    const result = await import(module);
    return [result.default, result];
  },
};
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
        script.async = node.type == "module";
        script.type = node.type;
        script.innerHTML = JSX.Syntax.compile(js, node.type == "module");
      }
    }
  }
}).observe(document, { subtree: true, childList: true });
JSX.applySpecial(document.head);
