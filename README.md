<h1 align="center">
<img src="just-jsx-wide.png">
</h1>

![](https://img.shields.io/npm/dt/just-jsx?style=for-the-badge) ![](https://img.shields.io/github/issues/ephf/just-jsx?style=for-the-badge) ![](https://img.shields.io/npm/l/just-jsx?style=for-the-badge) ![](https://img.shields.io/npm/v/just-jsx?style=for-the-badge)

✏️ A simple web package that allows you to compile JSX on the go.

## import

```html
<script src="https://unpkg.com/just-jsx"></script>
```

## use

Whenever you want a JSX script, create a script tag with a jsx attribute

```html
<script jsx>
  document.body.append(<h1>Hello!</h1>);
</script>
```

You can use custom elements by capitalizing the first letter of the tag

```jsx
function CustomElement({ attributes }) {
  this.innerHTML = "This is a custom element!";

  // or

  return <my-own-element>This is a custom element!</my-own-element>;
}

document.body.append(<CustomElement />);

// or

class CustomElement extends JSX.Component {
  render({ attributes }) {
    return <h1>This is a custom element</h1>;
  }
}
```

You can also add bits of code into the elements using curly-braces

```jsx
const attribute = "some value";
const html = "this is a pre-defined value";

document.body.append(<h1 something={attribute}>{html}</h1>);
```

You can create a collection of elements with the `JSX.Collection` tag

```jsx
<JSX.Collection>
  <h1>First thing</h1>
  <h2>Second thing</h2>
  <p>These elements don't have a parent node!</p>
</JSX.Collection>


// or

<>
  <h1>First thing</h1>
  <h2>Second thing</h2>
  <p>These elements don't have a parent node!</p>
</>
```

Although, the collections will return an instance of `HTMLCollection` which can't be appended to elements.

When you use a JSX collection, append it to other elements using the `collect` function

```js
document.body.collect(
  <>
    <h1>Hello!</h1>
    <p>How are you?</p>
  </>
);
```

To make finding elements that you have created faster, you can also use hooks. These are hook examples in a `JSX.Component`. Pressing the button will increase the number shown on the paragraph element.

```jsx
class HookExample extends JSX.Component {
  render() {
    this.count = 0;
    return (
      <div>
        <button
          onclick={() => {
            this.count++;
            this.counter.innerHTML = count; // <-- using hook here
          }}
        >
          Click me!
        </button>
        <p:counter>0</p:counter>
      </div>
    );
  }
}

document.body.append(<HookExample />);
```

Just know you can't directly access the hook in a function, although every element created through JSX has a hooks property. This time I will get the hook using a normal function (so I can access the element's `this` keyword) and the `.hooks` parameter.

```jsx
function HookExample() {
  let count = 0;
  return (
    <div>
      <button
        onclick={function () {
          count++;
          this.hooks.counter.innerHTML = count;
        }}
      >
        Click me!
      </button>
      <p:counter>0</p:counter>
    </div>
  );
}

document.body.append(<HookExample />);
```

## other

JSX automatically parses imports, but does not do so with dynamic imports. If you are using dynamic imports, use `JSX.import` instead of `import`

```js
const module = await JSX.import("file.js");
```

You can also compile javascript strings using a built in JSX function

```js
const myJSX = "<h1>Hello World</h1>";
const compiledJSX = JSX.Syntax.compile(myJSX, module?) // second arg true if code you are compiling is a module
```

Feel free to do pull requests and add issues to the [GitHub repository](https://github.com/ephf/just-jsx). This is not an official library from [React](https://www.npmjs.com/package/react), I'm just trying to make web development easier and faster.
