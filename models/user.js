const db = require("../db");
const ExpressError = require("../expressError");
const sqlForPartialUpdate = require("../helpers/partialUpdate");
const bcrypt = require("bcrypt");

const BCRYPT_WORK_FACTOR = 10;

class User {
    static async getAll() {
        const users = await db.query(
            `SELECT username, first_name, last_name, email
            FROM users`)

        return users.rows

    }

    static async register(data) {
        const duplicateCheck = await db.query(
            `SELECT username 
              FROM users 
              WHERE username = $1`,
            [data.username]
          );
        
        if (duplicateCheck.rows[0]) {
            throw new ExpressError(`Username taken: ${data.username}`, 400)
        }
        const hashed_pw = await bcrypt.hash(data.password, BCRYPT_WORK_FACTOR);

        const user = await db.query(
            `INSERT INTO users (username, password, first_name, last_name, email, photo_url)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING username, first_name, last_name, email, photo_url, is_admin`,
            [data.username, hashed_pw, data.first_name, data.last_name, data.email, data.photo_url])

        return user.rows[0];
    }

    static async getOne(username) {
        const user = await db.query(
            `SELECT username, first_name, last_name, email, photo_url
            FROM users
            WHERE username = $1`,
            [username])

        return user.rows[0];
    }

    static async update(username, data) {
        if (data.password) {
            data.password = await bcrypt.hash(data.password, BCRYPT_WORK_FACTOR);
          }
      
          let { query, values } = partialUpdate("users", data, "username", username);
      
          const result = await db.query(query, values);
          const user = result.rows[0];
      
          if (!user) {
            throw new ExpressError(`There exists no user '${username}'`, 404);
          }
      
          delete user.password;
          delete user.is_admin;
      
          return result.rows[0];
    }

    static async delete(username) {
        const user = await db.query(
            `DELETE FROM users
            WHERE username = $1
            RETURNING username`, [username]);
        
        if (!user.rows[0]) {
            throw new ExpressError(`No user found: ${username}`, 404);
        }
    }

    static async authenticate(data) {
        const result = await db.query(
            `SELECT username, 
                    password, 
                    first_name, 
                    last_name, 
                    email, 
                    photo_url, 
                    is_admin
              FROM users 
              WHERE username = $1`,
            [data.username]
          );
      
          const user = result.rows[0];
      
          if (user) {
            // compare hashed password to a new hash from password
            const isValid = await bcrypt.compare(data.password, user.password);
            if (isValid) {
              return user;
            }
          }
      
          throw ExpressError("Invalid Password", 401);
    }

}

module.exports = User;