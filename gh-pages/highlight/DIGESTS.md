## Subresource Integrity

If you are loading Highlight.js via CDN you may wish to use [Subresource Integrity](https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity) to guarantee that you are using a legimitate build of the library.

To do this you simply need to add the `integrity` attribute for each JavaScript file you download via CDN. These digests are used by the browser to confirm the files downloaded have not been modified.

```html
<script
  src="//cdnjs.cloudflare.com/ajax/libs/highlight.js/11.12.0/highlight.min.js"
  integrity="sha384-KnPvYPx1poT554tHDV1nuYV9sOkh4cZPBvLZQlXgJmoRQZPdgQNwL50/xq9kynp9"></script>
<!-- including any other grammars you might need to load -->
<script
  src="//cdnjs.cloudflare.com/ajax/libs/highlight.js/11.12.0/languages/go.min.js"
  integrity="sha384-orYKHAs3chK3oDMQLy5ywrzoY8z9zvzfmNIjmVxKXioAUtwDhP+xf6THWYSI/43Y"></script>
```

The full list of digests for every file can be found below.

### Digests

```
sha384-amdMjFrQeV1IlGyVyYRGeUBxPp1NVz7WG5xs0heAwCiAZLj0ISxeJwiOTeom9RfS /es/languages/css.js
sha384-rLeEizUP6J+98gF7EZ4ngav3h+slU5SqCVDahqOoYBEdjzhWQ3g6XldnqR9BSlBR /es/languages/css.min.js
sha384-mxaIAuwA1l6te9LMbWwt9PNtaoRiwRk1/345TMC2UQtNTi1kjbhizCrSxaHAegHF /es/languages/javascript.js
sha384-r8C5XKdITWu1xHcHMIfmqgbWZTa0w/MPyAykL+WctwUoeTsEHBo5+jSSoHQ+qFy6 /es/languages/javascript.min.js
sha384-XZNCXUeNSjWoW5lAESpD8AkU5NhwkwL0a6wIzJWfMEx6qNtF29L+81oxGOy4b3Pj /es/languages/xml.js
sha384-7lgbaoMNJXxrndTFyw0ll0hq1MZzDLFkFmLhYLibSJNXgcW6xOSU9e+OS2QaAKDP /es/languages/xml.min.js
sha384-+G97Y66qjmfAEeNK5AYrOqbLn/hBNX41qhtyiVW7z3Zq/1llyjGJr3gHmNi+AVKN /languages/css.js
sha384-FvHR2wIZNmDX0TgSuoOhAZRl6R5yRi26wu2/MVXDm1ZFCGJUvotj2RrvVLGC4y88 /languages/css.min.js
sha384-5vRFHgNazcqNV/wYjVV73vv/mmcguTGfUhutWTMzUdixVclmxoe32uu3C1i5U+b3 /languages/javascript.js
sha384-luOC72UPK+5vw8AmdAZNVaFIY8IN7MayLzqcVcnUdCCVug/rAyhze5dpWklUZW8b /languages/javascript.min.js
sha384-NNLNlM+AFtDXFlKRhmVO4gnfAl8a6U0y/QRO+jb8Cbx/1wYFSjpS8XF3mexCbQ7x /languages/xml.js
sha384-1iugfrw26YFHz7tD9aJCXklIDFXhf2qx4cJGfo4T8mWP+9nwOCnZpq0PqoXqcpO5 /languages/xml.min.js
sha384-kjgf7Bm5cjPHM7mOBpAyX8VtpzFvT8okh/LQes1bt4NQqBCkK/XDh7Vy25tjeVax /highlight.js
sha384-6ZV/8qNIIMmNy6Hqxv3J3adHxogcP99E+wjlTpQgk4bNSwDPX4qWYM408tyL0QRc /highlight.min.js
```

