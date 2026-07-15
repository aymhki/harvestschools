const b64ToBuf = (b64) => Uint8Array.from(atob(b64.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0)).buffer;
const bufToB64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));

const passkeySupported = () => !!(window.PublicKeyCredential && navigator.credentials?.create);

const decodeCreateArgs = (args) => {
    args.publicKey.challenge = b64ToBuf(args.publicKey.challenge);
    args.publicKey.user.id = b64ToBuf(args.publicKey.user.id);
    (args.publicKey.excludeCredentials || []).forEach(c => { c.id = b64ToBuf(c.id); });
    return args;
};

const decodeGetArgs = (args) => {
    args.publicKey.challenge = b64ToBuf(args.publicKey.challenge);
    (args.publicKey.allowCredentials || []).forEach(c => { c.id = b64ToBuf(c.id); });
    return args;
};

export { b64ToBuf, bufToB64, passkeySupported, decodeCreateArgs, decodeGetArgs };