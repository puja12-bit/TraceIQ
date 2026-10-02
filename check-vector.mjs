import * as fs from 'firebase/firestore';
console.log("Keys:", Object.keys(fs).filter(k => k.includes('Distance') || k.includes('Find') || k.includes('find')));
