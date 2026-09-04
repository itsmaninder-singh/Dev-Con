import { ProjectFile } from "../../models/projectFile.model.js";
import { decryptText, encryptText } from "../../utils/crypto.js";

const GITHUB_API = "https://api.github.com";

const authHeaders = (encryptedToken) => ({
  Authorization: `Bearer ${decryptText(encryptedToken)}`,
  Accept: "application/vnd.github+json",
});

const importRepoToProject = async ({ projectId, owner, repo, branch, encryptedToken, userId }) => {
  const treeRes = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
    { headers: authHeaders(encryptedToken) }
  );
  if (!treeRes.ok) throw new Error("Failed to fetch repo tree from GitHub");
  const treeData = await treeRes.json();

  const blobs = treeData.tree.filter((item) => item.type === "blob");

  for (const item of blobs) {
    const blobRes = await fetch(
      `${GITHUB_API}/repos/${owner}/${repo}/git/blobs/${item.sha}`,
      { headers: authHeaders(encryptedToken) }
    );
    if (!blobRes.ok) continue;
    const blobData = await blobRes.json();
    const content = Buffer.from(blobData.content, "base64").toString("utf8");

    const name = item.path.split("/").pop();

    await ProjectFile.findOneAndUpdate(
      { project: projectId, path: item.path },
      {
        project: projectId,
        path: item.path,
        name,
        type: "file",
        content,
        size: item.size || 0,
        githubSha: item.sha,
        createdBy: userId,
        lastEditedBy: userId,
        isDeleted: false,
      },
      { upsert: true, new: true }
    );
  }

  return { importedCount: blobs.length };
};

const pushFileToRepo = async ({ owner, repo, branch, fileId, encryptedToken, commitMessage }) => {
  const file = await ProjectFile.findById(fileId);
  if (!file) throw new Error("File not found");

  const contentBase64 = Buffer.from(file.content || "").toString("base64");

  let existingSha = file.githubSha;
  if (!existingSha) {
    const existingRes = await fetch(
      `${GITHUB_API}/repos/${owner}/${repo}/contents/${file.path}?ref=${branch}`,
      { headers: authHeaders(encryptedToken) }
    );
    if (existingRes.ok) {
      const existingData = await existingRes.json();
      existingSha = existingData.sha;
    }
  }

  const putRes = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/contents/${file.path}`,
    {
      method: "PUT",
      headers: authHeaders(encryptedToken),
      body: JSON.stringify({
        message: commitMessage || `Update ${file.path} via DevConnect workspace`,
        content: contentBase64,
        branch,
        sha: existingSha || undefined,
      }),
    }
  );

  if (!putRes.ok) {
    const err = await putRes.json().catch(() => ({}));
    throw new Error(err.message || "Failed to push file to GitHub");
  }

  const putData = await putRes.json();
  file.githubSha = putData.content.sha;
  await file.save();

  return { sha: file.githubSha };
};

export { importRepoToProject, pushFileToRepo };
