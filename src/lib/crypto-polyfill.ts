declare const globalThis: any;

// Cloudflare Workers polyfill for node:crypto
// In Cloudflare Workers, crypto is available globally via globalThis.crypto

const cryptoImpl = globalThis.crypto;

const cryptoObject = {
	getRandomValues: (array: any) => {
		return cryptoImpl.getRandomValues(array);
	},
	subtle: cryptoImpl.subtle,
	webcrypto: cryptoImpl
};

export default cryptoObject;

export const crypto = cryptoObject;
export const webcrypto = cryptoImpl;
export const CryptoKey = cryptoImpl.CryptoKey;
