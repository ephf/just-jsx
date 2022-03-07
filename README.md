# Just JSX

A simple web package that allows you to compile JSX on the go.

## import

```html
<script src="unpkg.com/just-jsx"></script>
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
function CustomElement() {
  this.innerHTML = "This is a custom element!";
}

document.body.append(<CustomElement></CustomElement>);
```

You can also add bits of code into the elements using curly-braces

```jsx
const attribute = "some value";
const html = "this is a pre-defined value";

document.body.append(<h1 something={attribute}>{html}</h1>);
```

You can create a collection of elements with the `JSX.Collection` tag

```jsx
document.body.append(
  <JSX.Collection>
    <h1>First thing</h1>
    <h2>Second thing</h2>
    <p>These elements don't have a parent node!</p>
  </JSX.Collection>
);
```
