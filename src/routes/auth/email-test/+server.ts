import { VERIFICATION_EMAIL } from "$lib/server/email.ts";

export const GET = (() => {
  return new Response(VERIFICATION_EMAIL.replaceAll("</head>", `
    <script>
      setInterval(async () => {
        let newData = await fetch(location.href).then(res => res.text());
        let newHTML = document.createElement("html");
        newHTML.innerHTML = newData;
        const newText = newHTML.textContent;
        const currentText = document.documentElement.textContent;
        if(newText !== currentText) {
          console.log({newText, currentText})
          location.href = "";
        }
      }, 1e3)
    </script>
    </head>
  `)
    .replaceAll("{VERIFICATION_LINK}", "https://whenplane.com/auth/verify-email?token=MSw4MywyNSw1MCw0LDE2NSwyMTIsMTkxLDksMjQ4LDkzLDE5LDgsOCw0MiwyMTAsOTU")
    .replaceAll("{USERNAME}", "ajgeiss0702"), {
    headers: {
      "Content-Type": "text/html",
    }
  })
})