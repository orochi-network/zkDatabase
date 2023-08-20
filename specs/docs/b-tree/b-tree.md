# B-tree

A B-tree is a type of self-balancing search tree that maintains sorted data in a manner that allows for efficient insertion, deletion, and search operations. It is commonly used in database and file systems where large amounts of data need to be stored and retrieved efficiently.

## Features

The main features of a B-tree are:

1. All leaves are at the same level, making the tree perfectly balanced.
2. Each node in the B-tree contains a certain number of keys and pointers. The keys act as separation values which divide its subtrees. When we insert a new key into a B-tree, and if the node we want to insert into is already full, we perform a split operation. Similarly, deletion might cause a node to be less than half full, violating the properties of the B-tree. In this case, we perform a merge operation.
3. For a B-tree of order m (where m is a positive integer), every node in the tree contains a maximum of m children and a minimum of ⌈m/2⌉ children (except for the root which can have fewer children).
4. The keys within a node are ordered.
5. The subtree between two keys k1 and k2 consists of all keys that are greater than or equal to k1 and less than k2.

## Operations

- Insertion
- Deletion
- Search
- Split and merge

### Split and Merge Operations

When we insert a new key into a B-tree, it's possible that the node we want to insert into is already full. In this case, we have to split the node. Here is a high-level overview of how the split operation works:

1. The node to be split is full and contains m-1 keys, where m is the order of the B-tree.
2. A new node is created, and approximately half of the keys from the original node are moved to this new node.
3. A key from the original node is moved up into the node's parent to act as a separator between the original node and the new node. If the original node was the root and has no parent, a new root is created.
4. The new node and the original node are now siblings.

The split operation maintains the property that all leaf nodes are at the same level since all splits start at the leaf level and work their way up the tree.

Conversely, deletion from a B-tree might cause a node to be less than half full, violating the properties of the B-tree. In such cases, we perform a merge operation. Here's a simplified view of the merge process:

1. Two sibling nodes, each with less than ⌈m/2⌉ keys, are combined into a single node.
2. A key from the parent node, which separates these two nodes, is moved down into the merged node.
3. If the parent node becomes less than half full as a result, it may also be merged with a sibling and so on.

### Time complexity

Each operation runs in logarithmic time - **O(log n)**, making B-trees useful for systems that read and write large blocks of data, such as databases and filesystems.

## Indexes

Database indexing is a data structure technique to efficiently retrieve records from the database files based on some attributes on which the indexing has been done. Indexing in databases works similarly to an index in a book.

Indexes are used to quickly locate data without having to search every row in a database table every time a database table is accessed. Indexes can be created using one or more columns of a database table, providing the basis for both rapid random lookups and efficient access of ordered records.

The two main types of database indexes are:

- **Clustered Index**: A clustered index determines the physical order of data in a table. Because the physical order of data in a table and the logical (index) order are the same, there can only be one clustered index per table.

- **Non-clustered Index**: A non-clustered index doesn’t sort the physical data inside the table. Instead, it creates a separate object within a table that contains the column(s) included in the index. The non-clustered index contains the column(s) values and the address of the record that the column(s) value corresponds to.

### Difference between Clustered and Non-Clustered Indexes

In a clustered index, the leaf nodes of the B-tree structure contain the actual data rows. This is why there can only be one clustered index per table because it actually determines the physical order of data in the table.

In a non-clustered index, the leaf nodes contain a pointer or reference to the data rows, not the data itself. The data can be stored anywhere else in the database, and this pointer helps to quickly locate the actual data when needed.

Additional considerations when choosing between a Clustered and Non-Clustered Index include the order of data, frequency of updates, width of the table, and the need for multiple indexes. For instance, if the data in a table is accessed sequentially, a clustered index can be beneficial. If a table requires access via multiple different key columns, non-clustered indexes could be a good solution as you can create multiple non-clustered indexes on a single table.

| S.No |                      | Clustered Indexes                                                                                       | Non-Clustered Indexes                                        |
| ---- | -------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| 1    | **Data sorting**     | Defines the order or sorts the table or arranges the data by alphabetical order just like a dictionary. | Collects the data at one place and records at another place. |
| 2    | **Speed**            | Generally faster for retrieving data in the sorted order or range of values.                            | Generally slower than the clustered index.                   |
| 3    | **Memory usage**     | Demands less memory to execute the operation.                                                           | Demands more memory to execute the operations.               |
| 4    | **Storage**          | Permits you to save data sheets in the leaf nodes of the index.                                         | Does not save data sheets in the leaf nodes of the index.    |
| 5    | **Number per table** | A single table can consist of a sole clustered index.                                                   | A table can consist of multiple non-clustered indexes.       |
| 6    | **Data storage**     | Has the natural ability to store data on the disk.                                                      | Does not have the natural ability to store data on the disk. |

Resources: [Difference between Clustered and Non-Clustered Index](https://byjus.com/gate/difference-between-clustered-and-non-clustered-index/#:~:text=1-,A%20clustered%20index%20is%20used%20to%20define%20the%20order%20or,and%20records%20at%20another%20place.)

### Choosing Between Clustered and Non-Clustered Indexes

The choice between a clustered index and a non-clustered index often depends on the specific use case, the nature of the data, and the types of queries the database will be serving

- **Order of Data**: If the data in a table is accessed sequentially, then a **clustered index** is typically the better choice because it physically stores the row data in sorted order. This can significantly speed up range queries and ordered access.
- **Frequent Updates**: If the indexed columns are updated frequently, **non-clustered indexes** can be a better choice. This is because any change to the data value of a clustered index requires physically rearranging the rows in the database, which can be an expensive operation.
- **Wide Tables**: In wide tables, where each row has a lot of data, **non-clustered indexes** can be beneficial. This is because non-clustered indexes only store the indexed columns and a pointer to the rest of the data, reducing the amount of data that needs to be read from disk for each query.
- **Multiple Indexes**: If a table needs to be accessed by multiple different key columns, **non-clustered indexe** can be a good solution because you can create multiple non-clustered indexes on a single table. Each non-clustered index will be optimized for access by its specific key column(s).

**Clustered Indexes**:

1. **Primary Key**: If a column is a unique identifier for rows in a table (like an ID), it should typically have a clustered index. The primary key of a table is a good candidate for a clustered index.
2. **Range Queries**: Clustered indexes are beneficial for range queries that return a large range of ordered data, and queries where you expect to retrieve the data sorted by the indexed columns. The database can read the data off the disk in one continuous disk scan.
3. **Frequently Accessed Tables**: If a table is frequently accessed by other database operations, like a foreign key relationship, a clustered index can help speed these operations.

Resources: (Clustered Index)[https://vladmihalcea.com/clustered-index/]

**Non-Clustered Indexes**:

1. **Non-Unique Columns**: If a column is not unique or has a high level of duplication, a non-clustered index can be a better choice.
2. **Specific Columns**: If only specific columns are frequently accessed, a non-clustered index can provide quicker lookups since it doesn’t need to go through the entire row.
3. **Covering Indexes**: For queries that can be covered by an index, a non-clustered index that includes all the necessary data can be highly efficient.
4. **Frequently Updated or Inserted Tables**: If a table's data is frequently updated or if new data is often inserted, using non-clustered indexes can be beneficial as they can be less resource-intensive to maintain.

### Multiple different keys

If you need to optimize access based on multiple different keys, it is more common to create multiple B-trees (i.e., multiple indexes), each with its own key. This way, you maintain the efficient logarithmic time complexity for searching, inserting, and deleting nodes in each tree.

## Storing data raws

A concise overview of data persistence:

1. When we insert records into a table with a clustered index (typically created on the primary key), the database management system stores the records directly within the leaf nodes of the B-tree structure for this index. The records are sorted in the B-tree based on the values of the primary key.
2. We can create additional non-clustered indexes on the same table. These non-clustered indexes also use a B-tree structure, but they work slightly differently. Instead of storing the full record within the leaf nodes, they store the index key (which could be any column or combination of columns, not necessarily the primary key) and a reference (like a pointer) to the actual record in the clustered index.
3. When we perform a lookup using a non-clustered index, the database management system first locates the index key in the B-tree of the non-clustered index, finds the reference to the actual record, then uses that reference to retrieve the record from the B-tree of the clustered index.
