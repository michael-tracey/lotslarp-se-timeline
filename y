{
  "indexes": [
    {
      "collectionGroup": "territories",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "isPoint",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "name",
          "order": "ASCENDING"
        }
      ],
      "density": "SPARSE_ALL"
    },
    {
      "collectionGroup": "territories",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "name",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "updatedAt",
          "order": "DESCENDING"
        }
      ],
      "density": "SPARSE_ALL"
    },
    {
      "collectionGroup": "territories",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "timeline.sect",
          "arrayConfig": "CONTAINS"
        },
        {
          "fieldPath": "name",
          "order": "ASCENDING"
        }
      ],
      "density": "SPARSE_ALL"
    },
    {
      "collectionGroup": "users",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "role",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "lastLogin",
          "order": "DESCENDING"
        }
      ],
      "density": "SPARSE_ALL"
    }
  ],
  "fieldOverrides": [
    {
      "collectionGroup": "territories",
      "fieldPath": "timeline",
      "ttl": false,
      "indexes": [
        {
          "arrayConfig": "CONTAINS",
          "queryScope": "COLLECTION"
        }
      ]
    }
  ]
}