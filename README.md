# Just JSX

A simple web package that allows you to compile JSX on the go.

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
}

document.body.append(<CustomElement></CustomElement>);

// or

class CustomElement extends JSX.Component {
  render({ attributes }) {
    this.innerHTML = "This is a custom element!";
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

## other

JSX automatically parses imports, but does not do so with dynamic imports. If you are using dynamic imports, use `JSX.import` instead of `import`

```js
const module = await JSX.import("file.js");
```

You can also compile javascript strings using a built in JSX function

```js
const myJSX = "<h1>Hello World</h1>";
const compiledJSX = JSX.compile(myJSX, module?) // second arg true if code you are compiling is a module
```

Feel free to do pull requests and add issues to the [GitHub repository](https://github.com/ephf/just-jsx). This is not an official library from [React](https://www.npmjs.com/package/react), I'm just trying to make web development easier and faster.
