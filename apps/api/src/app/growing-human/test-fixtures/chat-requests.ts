export const validChatRequest = {
  ageBand: '11-13',
  lane: 'feelings',
  messages: [{ role: 'child', text: '  Why do I feel angry so quickly?  ' }],
};

export const oversizedChatRequest = {
  ...validChatRequest,
  messages: [{ role: 'child', text: 'a'.repeat(501) }],
};
