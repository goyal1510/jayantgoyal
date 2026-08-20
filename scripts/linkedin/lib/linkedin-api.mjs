export async function publishToLinkedIn(
  { accessToken, personId, content, articleUrl },
  fetchImplementation = fetch,
) {
  const body = {
    author: `urn:li:person:${personId}`,
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": {
        shareCommentary: { text: content },
        shareMediaCategory: articleUrl ? "ARTICLE" : "NONE",
        ...(articleUrl && {
          media: [{ status: "READY", originalUrl: articleUrl }],
        }),
      },
    },
    visibility: {
      "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
    },
  };
  const response = await fetchImplementation(
    "https://api.linkedin.com/v2/ugcPosts",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify(body),
    },
  );
  if (!response.ok) {
    throw new Error(
      `LinkedIn publish failed (${response.status}): ${await response.text()}`,
    );
  }
  const payload = await response.json();
  if (!payload.id)
    throw new Error("LinkedIn publish response did not include a post URN.");
  return payload.id;
}

export async function deleteFromLinkedIn(
  { accessToken, postUrn },
  fetchImplementation = fetch,
) {
  const response = await fetchImplementation(
    `https://api.linkedin.com/v2/ugcPosts/${encodeURIComponent(postUrn)}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "X-Restli-Protocol-Version": "2.0.0",
      },
    },
  );
  if (!response.ok && response.status !== 404) {
    throw new Error(
      `LinkedIn delete failed (${response.status}): ${await response.text()}`,
    );
  }
}
