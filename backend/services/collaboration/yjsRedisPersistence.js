import * as Y from "yjs";
import redisClient from "../../config/redis.js";
import { ProjectFile } from "../../models/projectFile.model.js";

const docKey = (fileId) => `yjs:doc:${fileId}`;
const metaKey = (fileId) => `yjs:meta:${fileId}`;

const loadedDocs = new Map();

const loadDoc = async (fileId) => {
  if (loadedDocs.has(fileId)) return loadedDocs.get(fileId);

  const ydoc = new Y.Doc();
  const stored = await redisClient.get(docKey(fileId));

  if (stored) {
    const update = Buffer.from(stored, "base64");
    Y.applyUpdate(ydoc, update);
  } else {
    const file = await ProjectFile.findById(fileId);
    if (file && file.content) {
      ydoc.getText("content").insert(0, file.content);
    }
  }

  loadedDocs.set(fileId, ydoc);
  return ydoc;
};

const applyUpdate = async (fileId, update) => {
  const ydoc = await loadDoc(fileId);
  Y.applyUpdate(ydoc, update);

  const fullState = Y.encodeStateAsUpdate(ydoc);
  await redisClient.set(docKey(fileId), Buffer.from(fullState).toString("base64"));
  await redisClient.set(metaKey(fileId), Date.now().toString());

  return ydoc;
};

const getStateVector = async (fileId) => {
  const ydoc = await loadDoc(fileId);
  return Y.encodeStateVector(ydoc);
};

const getFullState = async (fileId) => {
  const ydoc = await loadDoc(fileId);
  return Y.encodeStateAsUpdate(ydoc);
};

const flushToMongo = async (fileId) => {
  const ydoc = loadedDocs.get(fileId);
  if (!ydoc) return;

  const text = ydoc.getText("content").toString();
  await ProjectFile.findByIdAndUpdate(fileId, {
    content: text,
    size: Buffer.byteLength(text, "utf8"),
  });
};

const evictDoc = async (fileId) => {
  await flushToMongo(fileId);
  loadedDocs.delete(fileId);
};

export {
  loadDoc,
  applyUpdate,
  getStateVector,
  getFullState,
  flushToMongo,
  evictDoc,
};
