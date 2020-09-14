const db = require("../db");
const ExpressError = require("../expressError");
const sqlForPartialUpdate = require("../helpers/partialUpdate");

class Job {
    
    static async searchAll(data) {
        let baseQuery = "SELECT id, title, company_handle FROM jobs";
        let whereExpressions = [];
        let queryValues = [];
    
        // const jobs = await db.query(
        //     `SELECT title, company_handle FROM jobs
        //     ORDER BY date_posted`)
        
        // return jobs.rows;
        if (data.min_salary) {
            queryValues.push(+data.min_employees);
            whereExpressions.push(`min_salary >= $${queryValues.length}`);
          }
      
          if (data.max_equity) {
            queryValues.push(+data.max_employees);
            whereExpressions.push(`min_equity >= $${queryValues.length}`);
          }
      
          if (data.search) {
            queryValues.push(`%${data.search}%`);
            whereExpressions.push(`title ILIKE $${queryValues.length}`);
          }
      
          if (whereExpressions.length > 0) {
            baseQuery += " WHERE ";
          }
      
          // Finalize query and return results
      
          let finalQuery = baseQuery + whereExpressions.join(" AND ");
          const jobsRes = await db.query(finalQuery, queryValues);
          return jobsRes.rows;
    }

    static async create(data) {
        const results = await db.query(
            `INSERT INTO jobs (title, salary, equity, company_handle)
            VALUES($1, $2, $3, $4)
            RETURNING id, title, salary, equity, company_handle`,
            [data.title, data.salary, data.equity, data.company_handle]);

        return results.rows[0];
        
    }

    static async getOne(id) {
        const jobRes = await db.query(
            `SELECT id, title, equity, company_handle FROM jobs
            WHERE id = $1`,
            [id]);
        const job = jobRes.rows[0];

        if (!job) {
            throw new ExpressError(`No job found for id: ${id}`, 404)
        }
        const companiesRes = await db.query(
            `SELECT name, num_employees, description, logo_url 
              FROM companies 
              WHERE handle = $1`,
            [job.company_handle]
          );
      
        job.company = companiesRes.rows[0];
        return job;
    }

    static async update(id, data) {
      let { query, values } = sqlForPartialUpdate("jobs", data, "id", id);
      const result = await db.query(query, values);
      const job = result.rows[0];
  
      if (!job) {
        throw new ExpressError(`There exists no job '${id}`, 404);
      }
  
      return job;

    }

    static async delete(id) {
        const results = await db.query(
                `DELETE FROM jobs WHERE id = $1
                RETURNING id`, [id]);
        if (!results.rows[0]) {
            throw new ExpressError(`No job found for id: ${id}`, 404)
        }
    }
}

module.exports = Job;