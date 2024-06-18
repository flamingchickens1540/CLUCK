import { jsxRenderer } from 'hono/jsx-renderer'

export const renderer = jsxRenderer(({ children, title, js, body_class }) => {
    return (
        <html>
            <head>
                <title>{title}</title>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <link href="/static/app.css" rel="stylesheet" />
                {js && <script async defer src={'/static/' + js + '.js'}></script>}
            </head>
            <body class={body_class ?? ''}>{children}</body>
        </html>
    )
})
