# B-tree

A B-tree is a type of self-balancing search tree that maintains sorted data in a manner that allows for efficient insertion, deletion, and search operations. It is commonly used in database and file systems where large amounts of data need to be stored and retrieved efficiently.

## Features

The main features of a B-tree are:
1) All leaves are at the same level, making the tree perfectly balanced.
2) Each node in the B-tree contains a certain number of keys and pointers. The keys act as separation values which divide its subtrees.
3) For a B-tree of order m (where m is a positive integer), every node in the tree contains a maximum of m children and a minimum of ⌈m/2⌉ children (except for the root which can have fewer children).
4) The keys within a node are ordered.
5) The subtree between two keys k1 and k2 consists of all keys that are greater than or equal to k1 and less than k2.

## Operations

- Insertion
- Deletion
- Search

### Time complexity

Each operation runs in logarithmic time, making B-trees useful for systems that read and write large blocks of data, such as databases and filesystems.

## Storing in distributed systems
