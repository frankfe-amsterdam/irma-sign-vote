import irma from "@privacybydesign/irma-frontend";

const btnEl = document.querySelector("button");
console.log(btnEl);
btnEl.addEventListener("click", signVote);

function signVote() {
  console.log("signing");
  irmaWeb
    .start()
    .then((result) => console.log("Successful disclosure! 🎉", result))
    .catch((error) => console.error("Couldn't do what you asked 😢", error));
}

const irmaWeb = irma.newWeb({
  debugging: false, // Enable to get helpful output in the browser console
  element: "#irma-web-form", // Which DOM element to render to

  // Back-end options
  session: {
    // Point this to your controller:
    url: "http://localhost:8000",

    start: {
      url: (o) => `${o.url}/start`,
      method: "GET",
    },
    result: {
      url: (o, { sessionPtr, sessionToken }) => `${o.url}/result`,
      method: "GET",
    },
  },
});
