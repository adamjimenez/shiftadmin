<template>
    <Bar
      id="my-chart-id"
      :options="chartOptions"
      :data="chartData"
    />
  </template>
  
  <script>
  import { Bar } from 'vue-chartjs'
  import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js'
  
  ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)
  
  export default {
    name: 'BarChart',
    components: { Bar },
    props: {
        items: null,
    },
    data() {
      return {
        chartOptions: {
          responsive: true,
          plugins: {
            legend: {
                display: false
            }
          }
        }
      }
    },
    computed: {
        chartData: function () {
            console.log(this.items)
            return {
                labels: this.items.map(({ label }) => label),
                datasets: [{
                    label: 'Data One',
                    backgroundColor: '#f87979',
                    data: this.items.map(({ total }) => total)
                }]
            };
        }
    }
  }
  </script>