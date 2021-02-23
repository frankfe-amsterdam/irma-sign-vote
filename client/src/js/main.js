import irma from '@privacybydesign/irma-frontend';

const signVote = async () => {
    try {
        const result = await irmaWeb.start();
        const reducedResult = reduceIRMAResult(result.disclosed);
        return reducedResult;
    } catch (e) {
        return null;
    }
};

const btnEl = document.querySelector('button');
btnEl.addEventListener('click', signVote);

const reduceIRMAResult = disclosedCredentialSets => {
    let joinedResults = {};
    disclosedCredentialSets.forEach(conjunction => {
        joinedResults = {
            ...joinedResults,
            ...conjunction.reduce(
                (acc, { id, rawvalue }) => ({
                    ...acc,
                    [id.match(/[^.]*$/g)[0]]: rawvalue
                }),
                {}
            )
        };
    });
    return joinedResults;
};

const irmaWeb = irma.newWeb({
    debugging: true,
    element: '#irma-web-form',
    session: {
        url: 'http://localhost:8000',

        start: {
            url: o => `${o.url}/start`,
            method: 'GET'
        },
        mapping: {
            sessionPtr: r => ({
                ...r.sessionPtr,
                u: r.sessionPtr.u.replace(/\/irma/g, '/irma/irma')
            })
        },
        result: {
            url: (o, { sessionToken }) => `${o.url}/result?token=${sessionToken}`
        }
    }
});
