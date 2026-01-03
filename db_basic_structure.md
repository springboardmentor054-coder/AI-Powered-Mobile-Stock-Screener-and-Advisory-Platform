# Stock Market Database Schema

This file shows the database tables and their columns in a table format.

---

## **1. companies**

| Column Name       | Data Type     | Constraints                  | Description                        |
|------------------|--------------|------------------------------|------------------------------------|
| company_id        | SERIAL       | PRIMARY KEY                  | Unique company ID                  |
| symbol            | VARCHAR(10)  | UNIQUE, NOT NULL             | Stock symbol                       |
| name              | VARCHAR(100) | NOT NULL                     | Company name                       |
| sector            | VARCHAR(50)  |                              | Business sector                    |
| market_cap        | BIGINT       |                              | Market capitalization              |
| promoter_holding  | FLOAT        |                              | Promoter holding percentage        |
| buyback_announced | BOOLEAN      | DEFAULT FALSE                | Whether buyback is announced       |


# Basic Structure of a Database

A **database** is a collection of organized data stored systematically in a computer system.  
It allows storing, retrieving, and managing data efficiently.

---

## 1. Database

- A database is a structured collection of data that supports easy access, management, and updating.

---

## 2. Tables (Entities)

- Tables are logical structures that organize data into rows and columns.  
- Each table represents an entity or category of information.

---

## 3. Columns (Fields/Attributes)

- Columns define the type of data stored in a table.  
- Each column has a **name**, **data type**, and optional **constraints** that define rules for the data.

---

## 4. Rows (Records/Entries)

- Rows are individual records in a table.  
- Each row contains values corresponding to the columns of the table.

---

## 5. Primary Key

- A primary key is a column or combination of columns that **uniquely identifies each row** in a table.

---

## 6. Foreign Key

- A foreign key is a column in one table that **links to the primary key of another table**, establishing relationships between tables.

---

## 7. Relationships

- Tables can be related to each other in various ways:  
  - **One-to-One:** Each row in one table is linked to only one row in another table.  
  - **One-to-Many:** Each row in one table is linked to multiple rows in another table.  
  - **Many-to-Many:** Multiple rows in one table are linked to multiple rows in another table.

---

## 8. Constraints

- Constraints are rules applied to columns or tables to **ensure data integrity**.  
- Common constraints include:  
  - `NOT NULL` – ensures a column cannot have null values.  
  - `UNIQUE` – ensures all values in a column are distinct.  
  - `PRIMARY KEY` – uniquely identifies each row.  
  - `FOREIGN KEY` – maintains referential integrity between tables.  
  - `CHECK` – ensures values meet specific conditions.  
  - `DEFAULT` – assigns a default value to a column if no value is provided.

---

## 9. Schema

- A schema is the **structural blueprint** of a database that defines tables, columns, data types, keys, and relationships.
