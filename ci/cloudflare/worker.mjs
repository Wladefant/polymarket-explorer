export default {
  fetch() {
    return new Response('CI worker version only\n', {
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    });
  },
};
