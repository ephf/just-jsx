<h1 align="center">
<img src="just-jsx.png">
</h1>

![](https://img.shields.io/npm/dt/just-jsx?style=for-the-badge) ![](https://img.shields.io/github/issues/ephf/just-jsx?style=for-the-badge) ![](https://img.shields.io/npm/l/just-jsx?style=for-the-badge) ![](https://img.shields.io/npm/v/just-jsx?style=for-the-badge)

> compile JSX on the go.
## Import

```html
<script src="https://unpkg.com/just-jsx"></script>
```

## Use

Create a `<script>` tag and add an empty `jsx` attribute to it and it will compile automatically

```html
<script jsx>
  document.body.append(
    <h1>Hello World</h1>
  )
</script>
```

## Extra features

#### Labels

##### `var:name`

Creates a global variable `name` that is set to the element

```js
<button var:mybutton>Click Me</button>

mybutton.onclick = () => {
  console.log("clicked my button");
}
```

##### `let:name`

Creates a scoped variable `name` tacked on to elements in its own group

```js
<div>
  <button onclick={function() {
    this.clickdisplay.innerHTML = "CLICKED!"; // works
  }}>Click Me</button>
  <h3 let:clickdisplay>hasn't clicked yet</h3>
</div>

console.log(clickdisplay, this.clickdisplay) // error, undefined
```

##### `data:name=value`

Adds a property `name` to target element with `value` (parsed with `JSON.parse` if possible)

```js
<button data:clickcount="0" onclick={function() {
  this.clickcount ++;
  console.log(this.clickcount + " clicks");
}}>Click Me</button>
```

## Changelog

##### 5.1.0

- Added import suport (`import ...` will be compiled and ran throught `jsx.import`)