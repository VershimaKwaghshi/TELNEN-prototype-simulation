import "./style.css"
import { simulateScalePoint, simulateAllScalePoints } from "./engine/scaleEngine"
import { runFullTELNENScenario } from "./engine/simulationEngine"

const root = document.querySelector("#root")

const money = value =>
  `$${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const number = value =>
  Number(value || 0).toLocaleString()

function row(label, value) {
  return `<tr><td>${label}</td><td>${value}</td></tr>`
}

function app() {
  root.innerHTML = `
    <header>
      <h1>TELNEN Simulation</h1>
      <p>Scale, trading economy, hard stop, restitution and Social Bond model.</p>
    </header>

    <main>
      <section class="card">
        <h2>Scale simulation</h2>

        <div class="controls">
          <label>
            Users
            <input id="users" type="number" value="10000" min="1">
          </label>

          <label>
            Capital Building
            <input id="cb" type="number" value="0.70" step="0.01" min="0" max="1">
          </label>

          <label>
            Social Bond
            <input id="sb" type="number" value="0.90" step="0.01" min="0" max="1">
          </label>

          <label>
            Profitable
            <input id="profit" type="number" value="0.10" step="0.01" min="0" max="1">
          </label>
        </div>

        <div class="actions">
          <button id="run">Run simulation</button>
          <button id="full">Run full TELNEN scenario</button>
        </div>
      </section>

      <section id="dashboard"></section>

      <section class="card">
        <h2>Scale comparison</h2>

        <div class="tableWrap">
          <table>
            <thead>
              <tr>
                <th>Users</th>
                <th>Active</th>
                <th>Capital Building</th>
                <th>Social Bond</th>
                <th>Lots</th>
                <th>TE revenue</th>
                <th>Claims</th>
                <th>TE buffer</th>
              </tr>
            </thead>

            <tbody id="scale"></tbody>
          </table>
        </div>
      </section>

      <section class="card">
        <h2>Scenario event log</h2>

        <pre id="events">Run the scenario to generate events.</pre>
      </section>
    </main>
  `

  const run = () => {
    const users = Number(document.querySelector("#users").value)

    const result = simulateScalePoint(users, {
      capitalBuildingRate: Number(
        document.querySelector("#cb").value
      ),

      socialBondAdoptionRate: Number(
        document.querySelector("#sb").value
      ),

      profitableTraderRate: Number(
        document.querySelector("#profit").value
      )
    })

    document.querySelector("#dashboard").innerHTML = `
      <section class="metrics">

        <div class="metric">
          <span>Users</span>
          <b>${number(result.users)}</b>
        </div>

        <div class="metric">
          <span>Active</span>
          <b>${number(result.population.activeUsers)}</b>
        </div>

        <div class="metric">
          <span>Lots</span>
          <b>${number(result.trading.lots)}</b>
        </div>

        <div class="metric">
          <span>TE revenue</span>
          <b>${money(result.revenue.te.totalRevenue)}</b>
        </div>

        <div class="metric">
          <span>Restitution exposure</span>
          <b>${money(result.restitution.totalClaims)}</b>
        </div>

        <div class="metric">
          <span>TE buffer</span>
          <b>${money(result.restitution.teBufferRequirement)}</b>
        </div>

      </section>

      <section class="two">

        <div class="card">
          <h2>TE revenue</h2>

          <table>
            <tbody>
              ${row(
                "Broker rebate",
                money(result.revenue.te.brokerRebate)
              )}

              ${row(
                "Withdrawal allocation",
                money(result.revenue.te.withdrawalAllocation)
              )}

              ${row(
                "Capital Building service",
                money(result.revenue.te.capitalBuildingServiceFees)
              )}

              ${row(
                "Social Bond",
                money(result.revenue.te.socialBondRevenue)
              )}

              ${row(
                "Total",
                money(result.revenue.te.totalRevenue)
              )}
            </tbody>
          </table>
        </div>

        <div class="card">
          <h2>Restitution</h2>

          <table>
            <tbody>
              ${row(
                "Claims",
                number(result.restitution.claimCount)
              )}

              ${row(
                "Total exposure",
                money(result.restitution.totalClaims)
              )}

              ${row(
                "Manager recovery",
                money(result.restitution.managerRecovery)
              )}

              ${row(
                "TE buffer",
                money(result.restitution.teBufferRequirement)
              )}
            </tbody>
          </table>
        </div>

      </section>
    `
  }

  const renderScale = () => {
    const results = simulateAllScalePoints({
      capitalBuildingRate: Number(
        document.querySelector("#cb").value
      ),

      socialBondAdoptionRate: Number(
        document.querySelector("#sb").value
      ),

      profitableTraderRate: Number(
        document.querySelector("#profit").value
      )
    })

    document.querySelector("#scale").innerHTML = results
      .map(
        r => `
          <tr>
            <td>${number(r.users)}</td>
            <td>${number(r.population.activeUsers)}</td>
            <td>${number(r.population.capitalBuildingUsers)}</td>
            <td>${number(r.population.socialBondUsers)}</td>
            <td>${number(r.trading.lots)}</td>
            <td>${money(r.revenue.te.totalRevenue)}</td>
            <td>${number(r.restitution.claimCount)}</td>
            <td>${money(r.restitution.teBufferRequirement)}</td>
          </tr>
        `
      )
      .join("")
  }

  document.querySelector("#run").addEventListener("click", () => {
    run()
    renderScale()
  })

  document.querySelector("#full").addEventListener("click", () => {
    try {
      const scenario = runFullTELNENScenario()

      document.querySelector("#events").textContent =
        scenario.events
          .map(
            (event, i) =>
              `${String(i + 1).padStart(2, "0")}  ${event.type}  ${JSON.stringify(event.data)}`
          )
          .join("\n")
    } catch (error) {
      document.querySelector("#events").textContent =
        error.message
    }
  })

  run()
  renderScale()
}

app()
