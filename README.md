<img src="jsx.png" width=100 align=right>

# Just JSX

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