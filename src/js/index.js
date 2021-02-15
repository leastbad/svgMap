import { countries } from './svgMap/countries'
import { emojiFlags } from './svgMap/emojiFlags'
import { paths } from './svgMap/mapPaths'
import svgPanZoom from 'svg-pan-zoom/src/svg-pan-zoom.js'

export default class {
  constructor (options) {
    // Default options, pass a custom options object to overwrite specific
    const defaultOptions = {
      // The element to render the map in
      element: null,

      // Minimum and maximum zoom
      minZoom: 1,
      maxZoom: 25,

      // Initial zoom
      initialZoom: 1.06,

      // Zoom sensitivity
      zoomScaleSensitivity: 0.2,

      // Zoom with mousewheel
      mouseWheelZoomEnabled: true,

      // Data colors
      colorMax: '#CC0033',
      colorMin: '#FFE5D9',
      colorNoData: '#E2E2E2',

      // The flag type can be 'image' or 'emoji'
      flagType: 'image',

      // The URL to the flags when using flag type 'image', {0} will get replaced with the lowercase country id
      flagURL:
        'https://cdn.jsdelivr.net/gh/hjnilsson/country-flags@latest/svg/{0}.svg',

      // Decide whether to show the flag option or not
      hideFlag: false,

      // The default text to be shown when no data is present
      noDataText: 'No data available',

      // Country specific options
      countries: {
        // Western Sahara: Set to false to combine Morocco (MA) and Western Sahara (EH)
        EH: true
      }
    }

    this.options = Object.assign({}, defaultOptions, options || {})

    // Abort if target element not found
    if (!this.options.element) console.log('Target element not found')

    // Abort if no data
    if (!this.options.data) console.log('No data')

    // Cache wrapper element
    this.wrapper = this.options.element

    // Global id
    this.id = this.wrapper.id

    // Create the map
    this.createMap()

    // Apply map data
    this.applyData(this.options.data)
  }

  createTooltip () {
    if (this.tooltip) return false

    this.tooltip = this.createElement(
      'div',
      'svgMap-tooltip',
      document.getElementsByTagName('body')[0]
    )

    this.tooltipContent = this.createElement(
      'div',
      'svgMap-tooltip-content-wrapper',
      this.tooltip
    )

    this.tooltipPointer = this.createElement(
      'div',
      'svgMap-tooltip-pointer',
      this.tooltip
    )
  }

  // Set the tooltips content
  setTooltipContent (content) {
    if (!this.tooltip) return
    this.tooltipContent.innerHTML = ''
    this.tooltipContent.append(content)
  }

  // Show the tooltip
  showTooltip (e) {
    this.tooltip.classList.add('svgMap-active')
    this.moveTooltip(e)
  }

  // Hide the tooltip
  hideTooltip () {
    this.tooltip.classList.remove('svgMap-active')
  }

  // Move the tooltip
  moveTooltip (e) {
    var x = e.pageX || (e.touches && e.touches[0] ? e.touches[0].pageX : null)
    var y = e.pageY || (e.touches && e.touches[0] ? e.touches[0].pageY : null)

    if (x === null || y === null) return

    const offsetToWindow = 6
    const offsetToPointer = 12
    const offsetToPointerFlipped = 32

    const wWidth = window.innerWidth
    const tWidth = this.tooltip.offsetWidth
    const tHeight = this.tooltip.offsetHeight

    // Adjust pointer when reaching window sides
    const left = x - tWidth / 2
    if (left <= offsetToWindow) {
      x = offsetToWindow + tWidth / 2
      this.tooltipPointer.style.marginLeft = left - offsetToWindow + 'px'
    } else if (left + tWidth >= wWidth - offsetToWindow) {
      x = wWidth - offsetToWindow - tWidth / 2
      this.tooltipPointer.style.marginLeft =
        (wWidth - offsetToWindow - e.pageX - tWidth / 2) * -1 + 'px'
    } else {
      this.tooltipPointer.style.marginLeft = '0px'
    }

    // Flip tooltip when reaching top window edge
    const top = y - offsetToPointer - tHeight
    if (top <= offsetToWindow) {
      this.tooltip.classList.add('svgMap-tooltip-flipped')
      y += offsetToPointerFlipped
    } else {
      this.tooltip.classList.remove('svgMap-tooltip-flipped')
      y -= offsetToPointer
    }

    this.tooltip.style.left = x + 'px'
    this.tooltip.style.top = y + 'px'
  }

  // Helper to create an element with a class name
  createElement (type, className, appendTo, innerhtml) {
    const element = document.createElement(type)
    if (className) {
      className = className.split(' ')
      className.forEach(item => {
        element.classList.add(item)
      })
    }
    innerhtml && (element.innerHTML = innerhtml)
    appendTo && appendTo.appendChild(element)
    return element
  }

  // Print numbers with commas
  numberWithCommas (nr, separator) {
    return nr.toString().replace(/\B(?=(\d{3})+(?!\d))/g, separator || ',')
  }

  // Get a color between two other colors
  getColor (color1, color2, ratio) {
    color1 = color1.slice(-6)
    color2 = color2.slice(-6)
    const r = Math.ceil(
      parseInt(color1.substring(0, 2), 16) * ratio +
        parseInt(color2.substring(0, 2), 16) * (1 - ratio)
    )
    const g = Math.ceil(
      parseInt(color1.substring(2, 4), 16) * ratio +
        parseInt(color2.substring(2, 4), 16) * (1 - ratio)
    )
    const b = Math.ceil(
      parseInt(color1.substring(4, 6), 16) * ratio +
        parseInt(color2.substring(4, 6), 16) * (1 - ratio)
    )
    return '#' + this.getHex(r) + this.getHex(g) + this.getHex(b)
  }

  // Get a hex value
  getHex (value) {
    value = value.toString(16)
    return ('0' + value).slice(-2)
  }

  // Get the name of a country by its ID
  getCountryName (countryID) {
    return this.options.countryNames && this.options.countryNames[countryID]
      ? this.options.countryNames[countryID]
      : countries[countryID]
  }

  applyData (data) {
    let max = null
    let min = null

    // Get highest and lowest value
    Object.keys(data.values).forEach(function (countryID) {
      const value = parseInt(data.values[countryID][data.applyData], 10)
      max === null && (max = value)
      min === null && (min = value)
      value > max && (max = value)
      value < min && (min = value)
    })

    data.data[data.applyData].thresholdMax &&
      (max = Math.min(max, data.data[data.applyData].thresholdMax))
    data.data[data.applyData].thresholdMin &&
      (min = Math.max(min, data.data[data.applyData].thresholdMin))

    // Loop through countries and set colors
    Object.keys(countries).forEach(countryID => {
      const element = document.getElementById(
        this.id + '-map-country-' + countryID
      )
      if (!element) return
      if (!data.values[countryID]) {
        element.setAttribute('fill', this.options.colorNoData)
        return
      }
      const value = Math.max(
        min,
        parseInt(data.values[countryID][data.applyData], 10)
      )
      const ratio = Math.max(0, Math.min(1, (value - min) / (max - min)))
      const color = this.getColor(
        this.options.colorMax,
        this.options.colorMin,
        ratio
      )
      element.setAttribute('fill', color)
    })
  }

  createMap () {
    this.createTooltip()

    // Create map wrappers
    this.mapWrapper = this.createElement(
      'div',
      'svgMap-map-wrapper',
      this.wrapper
    )
    this.mapImage = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'svg'
    )
    this.mapImage.setAttribute('viewBox', '0 0 2000 1001')
    this.mapImage.classList.add('svgMap-map-image')
    this.mapWrapper.appendChild(this.mapImage)

    // Add controls
    const mapControlsWrapper = this.createElement(
      'div',
      'svgMap-map-controls-wrapper',
      this.mapWrapper
    )

    const zoomContainer = this.createElement(
      'div',
      'svgMap-map-controls-zoom',
      mapControlsWrapper
    )
    ;['in', 'out'].forEach(item => {
      const zoomControlName =
        'zoomControl' + item.charAt(0).toUpperCase() + item.slice(1)
      this[zoomControlName] = this.createElement(
        'button',
        'svgMap-control-button svgMap-zoom-button svgMap-zoom-' +
          item +
          '-button',
        zoomContainer
      )
      this[zoomControlName].type = 'button'
      this[zoomControlName].addEventListener('click', () => this.zoomMap(item))
    })

    // Add accessible names to zoom controls
    this.zoomControlIn.setAttribute('aria-label', 'Zoom in')
    this.zoomControlOut.setAttribute('aria-label', 'Zoom out')

    // Fix countries
    const mapPaths = Object.assign({}, paths)

    if (!countries.EH) {
      mapPaths.MA.d = mapPaths['MA-EH'].d
      delete mapPaths.EH
    }
    delete mapPaths['MA-EH']

    // Add map elements
    Object.keys(mapPaths).forEach(countryID => {
      const countryData = mapPaths[countryID]
      if (!countryData.d) return

      const countryElement = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'path'
      )

      countryElement.setAttribute('d', countryData.d)
      countryElement.setAttribute('id', this.id + '-map-country-' + countryID)
      countryElement.setAttribute('data-id', countryID)
      countryElement.classList.add('svgMap-country')

      this.mapImage.appendChild(countryElement)
      ;['mouseenter', 'touchdown'].forEach(event => {
        countryElement.addEventListener(event, () =>
          countryElement.closest('g').appendChild(countryElement)
        )
      })

      // TODO Tooltip events
      // Make Country fixed on click
      /* countryElement.addEventListener('click', function () {
      var countryID = countryElement.getAttribute('data-id');
      console.log(countryID);
    });*/

      // Tooltip events
      // Add tooltip when touch is used
      countryElement.addEventListener('touchstart', e => {
        const countryID = countryElement.getAttribute('data-id')
        setTooltipContent(this.getTooltipContent(countryID))
        this.showTooltip(e)
        this.moveTooltip(e)
      })

      countryElement.addEventListener('mouseenter', e => {
        const countryID = countryElement.getAttribute('data-id')
        this.setTooltipContent(this.getTooltipContent(countryID))
        this.showTooltip(e)
      })

      countryElement.addEventListener('mousemove', e => this.moveTooltip(e))
      ;[('mouseleave', 'touchend')].forEach(event => {
        countryElement.addEventListener(event, () => this.hideTooltip())
      })
    })

    // Expose instance
    const self = this

    // Init pan zoom
    this.mapPanZoom = svgPanZoom(this.mapImage, {
      zoomEnabled: true,
      fit: true,
      center: true,
      minZoom: this.options.minZoom,
      maxZoom: this.options.maxZoom,
      zoomScaleSensitivity: this.options.zoomScaleSensitivity,
      controlIconsEnabled: false,
      mouseWheelZoomEnabled: this.options.mouseWheelZoomEnabled, // TODO Only with key pressed
      onZoom: () => self.setControlStatuses(),
      beforePan: function (oldPan, newPan) {
        const gutterWidth = self.mapWrapper.offsetWidth * 0.85
        const gutterHeight = self.mapWrapper.offsetHeight * 0.85
        const sizes = this.getSizes()
        const leftLimit =
          -((sizes.viewBox.x + sizes.viewBox.width) * sizes.realZoom) +
          gutterWidth
        const rightLimit =
          sizes.width - gutterWidth - sizes.viewBox.x * sizes.realZoom
        const topLimit =
          -((sizes.viewBox.y + sizes.viewBox.height) * sizes.realZoom) +
          gutterHeight
        const bottomLimit =
          sizes.height - gutterHeight - sizes.viewBox.y * sizes.realZoom
        return {
          x: Math.max(leftLimit, Math.min(rightLimit, newPan.x)),
          y: Math.max(topLimit, Math.min(bottomLimit, newPan.y))
        }
      }
    })

    // Init pan zoom
    this.mapPanZoom.zoom(this.options.initialZoom)

    // Initial zoom statuses
    this.setControlStatuses()
  }

  // Create the tooltip content
  getTooltipContent (countryID) {
    const tooltipContentWrapper = this.createElement(
      'div',
      'svgMap-tooltip-content-container'
    )

    if (this.options.hideFlag === false) {
      // Flag
      const flagContainer = this.createElement(
        'div',
        'svgMap-tooltip-flag-container svgMap-tooltip-flag-container-' +
          this.options.flagType,
        tooltipContentWrapper
      )

      if (this.options.flagType === 'image') {
        this.createElement(
          'img',
          'svgMap-tooltip-flag',
          flagContainer
        ).setAttribute(
          'src',
          this.options.flagURL.replace('{0}', countryID.toLowerCase())
        )
      } else if (this.options.flagType === 'emoji') {
        flagContainer.innerHTML = emojiFlags[countryID]
      }
    }

    // Title
    this.createElement(
      'div',
      'svgMap-tooltip-title',
      tooltipContentWrapper
    ).innerHTML = this.getCountryName(countryID)

    // Content
    const tooltipContent = this.createElement(
      'div',
      'svgMap-tooltip-content',
      tooltipContentWrapper
    )
    if (!this.options.data.values[countryID]) {
      this.createElement(
        'div',
        'svgMap-tooltip-no-data',
        tooltipContent
      ).innerHTML = this.options.noDataText
    } else {
      let tooltipContentTable = '<table>'
      Object.keys(this.options.data.data).forEach(
        function (key) {
          const item = this.options.data.data[key]
          let value = this.options.data.values[countryID][key]
          item.floatingNumbers && (value = value.toFixed(1))
          item.thousandSeparator &&
            (value = this.numberWithCommas(value, item.thousandSeparator))
          value = item.format
            ? item.format.replace('{0}', '<span>' + value + '</span>')
            : '<span>' + value + '</span>'
          tooltipContentTable +=
            '<tr><td>' + (item.name || '') + '</td><td>' + value + '</td></tr>'
        }.bind(this)
      )
      tooltipContentTable += '</table>'
      tooltipContent.innerHTML = tooltipContentTable
    }
    return tooltipContentWrapper
  }

  // Set the disabled statuses for buttons
  setControlStatuses () {
    this.zoomControlIn.classList.remove('svgMap-disabled')
    this.zoomControlIn.setAttribute('aria-disabled', 'false')
    this.zoomControlOut.classList.remove('svgMap-disabled')
    this.zoomControlOut.setAttribute('aria-disabled', 'false')

    if (this.mapPanZoom.getZoom().toFixed(3) <= this.options.minZoom) {
      this.zoomControlOut.classList.add('svgMap-disabled')
      this.zoomControlOut.setAttribute('aria-disabled', 'true')
    }
    if (this.mapPanZoom.getZoom().toFixed(3) >= this.options.maxZoom) {
      this.zoomControlIn.classList.add('svgMap-disabled')
      this.zoomControlIn.setAttribute('aria-disabled', 'true')
    }
  }

  // Zoom map
  zoomMap (direction) {
    if (
      this[
        'zoomControl' + direction.charAt(0).toUpperCase() + direction.slice(1)
      ].classList.contains('svgMap-disabled')
    ) {
      return false
    }
    this.mapPanZoom[direction == 'in' ? 'zoomIn' : 'zoomOut']()
  }
}
