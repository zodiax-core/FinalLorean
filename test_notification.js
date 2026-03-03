const url = 'https://aeegdozbtqifmbhyfoso.supabase.co/functions/v1/push-notifications';
const body = {
    type: 'order',
    payload: {
        title: 'Script Test',
        message: 'Testing from node script',
        user_id: '2727859c-e4ce-4911-998e-cf6adebe1a93'
    }
};

fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
})
    .then(res => res.json())
    .then(json => console.log(JSON.stringify(json, null, 2)))
    .catch(err => console.error(err));
