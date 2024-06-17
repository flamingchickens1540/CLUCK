import { jsxRenderer } from 'hono/jsx-renderer'
import { render } from 'hono/jsx/dom'

export const renderer = jsxRenderer(({ children, title, js }) => {
    return (
        <html>
            <head>
                <title>{title}</title>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <link href="/app.css" rel="stylesheet" />
                {js && <script async defer src={'/static/' + js + '.js'}></script>}
            </head>
            <body>{children}</body>
        </html>
    )
})
