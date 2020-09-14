const db = require("../db");
const ExpressError = require("../expressError");
const sqlForPartialUpdate = require("../helpers/partialUpdate");

class Company {
    
    static async searchAll(data) {
        let baseQuery = `SELECT handle, name FROM companies`
        let whereExpressions = [];
        let queryValues = [];
        // let allResults = await db.query(`SELECT handle, name FROM companies`)

        if (+data.min_employees >= +data.max_employees) {
            throw new ExpressError(
              "Min employees must be less than max employees",
              400
            );
          }
        if (data.min_employees) {
            queryValues.push(+data.min_employees);
            whereExpressions.push(`num_employees >= $${queryValues.length}`);
          }
      
          if (data.max_employees) {
            queryValues.push(+data.max_employees);
            whereExpressions.push(`num_employees <= $${queryValues.length}`);
          }
      
          if (data.search) {
            queryValues.push(`%${data.search}%`);
            whereExpressions.push(`name ILIKE $${queryValues.length}`);
          }
      
          if (whereExpressions.length > 0) {
            baseQuery += " WHERE ";
          }
        // return allResults.rows;
        let finalQuery =
        baseQuery + whereExpressions.join(" AND ") + " ORDER BY name";
      const companiesRes = await db.query(finalQuery, queryValues);
      return companiesRes.rows;
    } 

    static async create(data) {

        const nameCheck = await db.query(
            `SELECT handle FROM companies WHERE handle = $1`, [data.handle]);
        if (nameCheck.rows[0]) {
            throw new ExpressError(`Company already exists with handle: ${data.handle}`, 400)
        }

        const results = await db.query(
            `INSERT INTO companies
            (handle, name, num_employees, description, logo_url)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING handle, name, num_employees, description, logo_url`,
            [data.handle, data.name, data.num_employees, data.description, data.logo_url]);

        return results.rows[0]
    }

    static async search(handle) {
        const companyRes = await db.query(
            `SELECT * FROM companies WHERE handle=$1`, [handle])
        const company = companyRes.rows[0];
        if (!company) {
            throw new ExpressError(`No company found: ${handle} `, 404)
        }
        const jobRes = await db.query(
          `SELECT id, title, salary, equity, company_handle FROM jobs
          WHERE company_handle = $1`, [company.handle]);

        company.jobs = jobRes.rows[0];
        
        return company
    }

    static async update(handle, data) {
        let { query, values } = sqlForPartialUpdate(
            "companies",
            data,
            "handle",
            handle
          );

          const result = await db.query(query, values);
          const company = result.rows[0];
      
          if (!company) {
            throw new ExpressError(`There exists no company '${handle}`, 404);
          }
      
          return company;
    }

    static async delete(handle) {
        const result = await db.query(
            `DELETE FROM companies
            WHERE handle=$1
            RETURNING handle`,
            [handle])

        if (!result.rows[0]) {
            throw new ExpressError(`No company found: ${handle}`, 404)
        }
    }
}

module.exports = Company;