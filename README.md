<img src="jsx.png" width=100 align=right>

# Just JSX

![](https://img.shields.io/npm/dt/just-jsx?style=for-the-badge) ![](https://img.shields.io/github/issues/ephf/just-jsx?style=for-the-badge) ![](https://img.shields.io/npm/l/just-jsx?style=for-the-badge) ![](https://img.shields.io/npm/v/just-jsx?style=for-the-badge)

> compile JSX on the go.

## Import

```html
<script src="https://unpkg.com/just-jsx"></script>
```

## Use

Create a `<script>` tag and add an empty `jsx` attribute to it and it will compile automatically.

```html
<script jsx>
  document.body.append(
    <h1>Hello World</h1>
  )
</script>
```

### Compiler

The compiler is optional, you can use it by installing the package globally.

```bash
npm install just-jsx -g
```

The compiler will compile `.js` `.jsx` `.ts` and `.tsx` files as-is and will replace script tags with the `jsx` attribute in `.html` files with compiled code

Run the command `jsxc` to compile a directory or a file into `out/`

```bash
jsxc [filename/dirname] [-o outputDirname:out]
```

compile a single file

```bash
jsxc file.js
```

compile all files in a directory

```bash
jsxc src
```

specify a custom output directory

```bash
jsxc src -o build
```