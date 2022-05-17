import { supportedRecordTypesArray } from "@pektin/client";

export const snippets = [
  {
    caption: "get",
    description: "A basic pektin-api get request body",
    snippet: `[
    {
        "name": "\${1:}",
        "rr_type": "\${2:}"
    }
]`,
    type: "snippet",
    meta: "request body",
  },
  {
    caption: "get-zone-records",
    description: "A basic pektin-api get-zone-records request body",
    snippet: `[
"\${1:}"
]`,
    type: "snippet",
    meta: "request body",
  },
  {
    caption: "set",
    description: "A basic pektin-api set request body",
    snippet: `[
    {
        "name": "\${1:}",
        "rr_type": "\${2:}",
        "ttl": 60\${3:},
        "rr_set": [
            {
                "value":"\${3:}"
            }
        ]
    }
]`,
    type: "snippet",
    meta: "request body",
  },

  {
    caption: "delete",
    description: "A basic pektin-api delete request body",
    snippet: `[
    {
        "name": "\${1:}",
        "rr_type": "\${2:}"
    }
]`,
    type: "snippet",
    meta: "request body",
  },
  {
    caption: "search",
    description: "A basic pektin-api search request body",
    snippet: `[
      {
          "name": "\${1:}",
          "rr_type": "\${2:}"
      }
]`,
    type: "snippet",
    meta: "request body",
  },
  {
    caption: "health",
    description: "Health doesn't need a request body",
    snippet: `{}`,
    type: "snippet",
    meta: "request body",
  },
];
export const getDomainSnippets = (domains: string[]) => {
  return domains.map((d) => {
    return {
      caption: d,
      description: `Your domain ${d}`,
      snippet: d,
      type: "snippet",
      meta: "domain",
    };
  });
};

export const rrSnippets = supportedRecordTypesArray.map((t) => {
  return {
    caption: t,
    description: `The resource record type ${t}`,
    snippet: t,
    type: "snippet",
    meta: "rr_type",
  };
});
