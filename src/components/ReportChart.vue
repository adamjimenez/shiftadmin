<template>
  <Line v-if="type === 'line'" :options="chartOptions" :data="chartData" />
  <Bar v-else :options="chartOptions" :data="chartData" />
</template>

<script>
import { Bar, Line } from 'vue-chartjs'

import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement
} from 'chart.js'

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement
)

export default {
  name: 'BarChart',
  components: { Bar, Line },
  props: {
    items: null,
    type: null,
    label: null,
    format: null,
  },
  data() {
    return {
      chartOptions: {
        responsive: true,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: tooltipItem => {
                let formatOptions = {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                };

                if (this.format === 'currency') {
                  formatOptions.style = 'currency';
                  formatOptions.currency = 'GBP';
                }

                return tooltipItem.raw.toLocaleString(undefined, formatOptions);
              }
            }
          }
        },
      },
      color: '#f87979'
    }
  },
  computed: {
    chartData: function () {
      return {
        labels: this.items.map(({ label }) => label),
        datasets: [{
          label: this.label,
          data: this.items.map(({ total }) => total),
          backgroundColor: this.color,
          borderColor: this.color,
        }]
      }
    }
  }
}
</script>