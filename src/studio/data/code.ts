import type { CodeTour, GlossaryEntry } from "../types";

export const GLOSSARY: Record<string, GlossaryEntry> = {
  gpio_config_t: {
    title: "gpio_config_t",
    category: "GPIO Driver",
    desc: "Configuration struct defining pin_bit_mask, mode (INPUT/OUTPUT), pull_up_en, pull_down_en, and intr_type.",
    tip: "Always use (1ULL << GPIO_NUM) for pin_bit_mask so pins >= 32 do not overflow a 32-bit int!",
  },
  gpio_config: {
    title: "gpio_config(&io_conf)",
    category: "GPIO Driver",
    desc: "Applies direction, pull resistor, and interrupt trigger configuration to every pin bit set in pin_bit_mask.",
    tip: "Call once during init rather than configuring pins individually in a loop.",
  },
  gpio_set_level: {
    title: "gpio_set_level(gpio_num, level)",
    category: "GPIO Driver",
    desc: "Sets the digital output state (0 = LOW / 0V, 1 = HIGH / 3.3V) of a configured GPIO pin.",
    tip: "Under the hood, writes to GPIO_OUT_W1TS_REG or GPIO_OUT_W1TC_REG atomically.",
  },
  vTaskDelay: {
    title: "vTaskDelay(ticks)",
    category: "FreeRTOS",
    desc: "Suspends the calling task for a given number of RTOS ticks, yielding the CPU to other tasks and feeding the Watchdog.",
    tip: "Use pdMS_TO_TICKS(ms) to convert milliseconds cleanly regardless of CONFIG_FREERTOS_HZ.",
  },
  pdMS_TO_TICKS: {
    title: "pdMS_TO_TICKS(ms)",
    category: "FreeRTOS Macro",
    desc: "Converts a time in milliseconds to FreeRTOS tick count (default 100 Hz = 10 ms per tick on ESP-IDF).",
    tip: "Delays shorter than 1 tick (<10 ms) evaluate to 0 ticks; use esp_rom_delay_us() for microsecond pulses.",
  },
  i2c_param_config: {
    title: "i2c_param_config(port, &conf)",
    category: "I2C Driver",
    desc: "Configures SDA/SCL GPIO routing, internal pull-ups, master/slave mode, and bus clock speed (up to 400 kHz).",
    tip: "Routes signals through the ESP32-S3 GPIO Matrix so almost any free GPIO can act as SDA/SCL.",
  },
  i2c_driver_install: {
    title: "i2c_driver_install(port, mode, ...)",
    category: "I2C Driver",
    desc: "Allocates ISR handlers and ring buffers for the specified I2C controller (I2C_NUM_0 or I2C_NUM_1).",
    tip: "In Master mode, rx_buf_len and tx_buf_len should be set to 0.",
  },
  spi_bus_initialize: {
    title: "spi_bus_initialize(host, &buscfg, dma)",
    category: "SPI Master",
    desc: "Initializes SPI2_HOST or SPI3_HOST pins (MOSI, MISO, SCLK) and binds a GDMA channel for high-speed transfers.",
    tip: "Pass SPI_DMA_CH_AUTO to let ESP-IDF automatically pick a free GDMA channel.",
  },
  spi_bus_add_device: {
    title: "spi_bus_add_device(host, &devcfg, &handle)",
    category: "SPI Master",
    desc: "Attaches a specific SPI slave (like MFRC522) with its own Chip Select (CS) pin, clock speed, and SPI mode (0–3).",
    tip: "Multiple SPI devices can share MOSI/MISO/SCLK as long as each has a unique CS GPIO.",
  },
  esp_ble_gap_start_advertising: {
    title: "esp_ble_gap_start_advertising(&params)",
    category: "BLE GAP",
    desc: "Starts broadcasting BLE advertising packets on RF channels 37, 38, and 39 so scanners can discover the ESP32-S3.",
    tip: "Advertising intervals between 100 ms and 500 ms balance fast discovery with low battery draw.",
  },
  esp_ble_gatts_register_callback: {
    title: "esp_ble_gatts_register_callback(cb)",
    category: "BLE GATT Server",
    desc: "Registers the event handler invoked on client connect, disconnect, characteristic read, write, and CCCD notify enable.",
    tip: "Keep GATT callbacks non-blocking; offload heavy work to a FreeRTOS queue/task.",
  },
  i2s_new_channel: {
    title: "i2s_new_channel(&chan_cfg, &tx, NULL)",
    category: "I2S v5 Driver",
    desc: "Allocates an I2S TX/RX hardware channel with DMA descriptor count and frame buffer sizing.",
    tip: "ESP-IDF v5 introduced the new channel-based I2S API replacing legacy i2s_driver_install().",
  },
  i2s_channel_write: {
    title: "i2s_channel_write(tx, buf, size, &written, timeout)",
    category: "I2S v5 Driver",
    desc: "Copies PCM audio samples into the GDMA ring buffer for continuous hardware playback to the MAX98357A.",
    tip: "Blocks cleanly via FreeRTOS semaphore until a DMA descriptor frees up — perfect for audio synthesis loops.",
  },
  ESP_ERROR_CHECK: {
    title: "ESP_ERROR_CHECK(expr)",
    category: "Diagnostics",
    desc: "Checks if an ESP-IDF function returned ESP_OK; if not, prints file/line/error string and triggers an abort.",
    tip: "Essential during initialization so hardware misconfigurations fail loudly instead of silently.",
  },
  ESP_LOGI: {
    title: "ESP_LOGI(tag, fmt, ...)",
    category: "Logging",
    desc: "Emits an INFO-level formatted log line with millisecond timestamp over UART0 or USB-Serial-JTAG.",
    tip: "Filter verbosity per tag at runtime with esp_log_level_set().",
  },
};

export const CODE_TOURS: CodeTour[] = [
  {
    id: "blink",
    title: "Blink & RGB LED (GPIO)",
    file: "main/blink_example.c",
    code: `#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "driver/gpio.h"

#define LED_GPIO   48
#define BOOT_BTN   0

void app_main(void) {
    gpio_config_t io_conf = {
        .pin_bit_mask = (1ULL << LED_GPIO),
        .mode = GPIO_MODE_OUTPUT,
        .pull_up_en = GPIO_PULLUP_DISABLE,
        .intr_type = GPIO_INTR_DISABLE
    };
    ESP_ERROR_CHECK(gpio_config(&io_conf));

    int state = 0;
    while (1) {
        state = !state;
        gpio_set_level(LED_GPIO, state);
        vTaskDelay(pdMS_TO_TICKS(500));
    }
}`,
    steps: [
      {
        lines: [5, 6],
        title: "Pin Definitions",
        text: "GPIO48 drives the onboard RGB LED on DevKitC-1, while GPIO0 is wired to the tactile BOOT strapping switch.",
      },
      {
        lines: [9, 15],
        title: "Configure GPIO Output",
        text: "We build a 64-bit pin_bit_mask (critical for GPIO >= 32!) and apply it via gpio_config(), updating GPIO_ENABLE1_REG.",
      },
      {
        lines: [18, 22],
        title: "Non-Blocking FreeRTOS Loop",
        text: "gpio_set_level() flips the output register atomically, and vTaskDelay() yields for 500 ms so the Idle task feeds the Watchdog.",
      },
    ],
  },
  {
    id: "oled",
    title: "I2C OLED Display (SSD1306)",
    file: "main/oled_i2c.c",
    code: `#include "driver/i2c.h"
#include "esp_log.h"

#define I2C_SDA_PIN  8
#define I2C_SCL_PIN  9
#define OLED_ADDR    0x3C

void oled_i2c_init(void) {
    i2c_config_t conf = {
        .mode = I2C_MODE_MASTER,
        .sda_io_num = I2C_SDA_PIN,
        .scl_io_num = I2C_SCL_PIN,
        .sda_pullup_en = GPIO_PULLUP_ENABLE,
        .scl_pullup_en = GPIO_PULLUP_ENABLE,
        .master.clk_speed = 400000
    };
    ESP_ERROR_CHECK(i2c_param_config(I2C_NUM_0, &conf));
    ESP_ERROR_CHECK(i2c_driver_install(I2C_NUM_0, conf.mode, 0, 0, 0));
    ESP_LOGI("OLED", "SSD1306 ready at 0x%02X", OLED_ADDR);
}`,
    steps: [
      {
        lines: [4, 6],
        title: "I2C Bus & Slave Address",
        text: 'GPIO8 (SDA) and GPIO9 (SCL) are routed through the ESP32-S3 GPIO Matrix. Most 0.96" SSD1306 modules respond at 0x3C.',
      },
      {
        lines: [9, 16],
        title: "400 kHz Fast-Mode Config",
        text: "Internal pull-ups are enabled for short breadboard runs, and clk_speed is set to 400 kHz for crisp 30+ FPS redraws.",
      },
      {
        lines: [17, 19],
        title: "Install Hardware Driver",
        text: "i2c_param_config() writes timing registers and i2c_driver_install() activates the I2C0 hardware FIFO and interrupts.",
      },
    ],
  },
  {
    id: "rfid",
    title: "SPI RFID Reader (MFRC522)",
    file: "main/rfid_spi.c",
    code: `#include "driver/spi_master.h"

#define PIN_MISO  13
#define PIN_MOSI  11
#define PIN_CLK   12
#define PIN_CS    10

spi_device_handle_t rfid_init(void) {
    spi_bus_config_t buscfg = {
        .miso_io_num = PIN_MISO,
        .mosi_io_num = PIN_MOSI,
        .sclk_io_num = PIN_CLK,
        .max_transfer_sz = 64
    };
    ESP_ERROR_CHECK(spi_bus_initialize(SPI2_HOST, &buscfg, SPI_DMA_CH_AUTO));

    spi_device_interface_config_t devcfg = {
        .clock_speed_hz = 4 * 1000 * 1000,
        .mode = 0,
        .spics_io_num = PIN_CS,
        .queue_size = 4
    };
    spi_device_handle_t handle;
    ESP_ERROR_CHECK(spi_bus_add_device(SPI2_HOST, &devcfg, &handle));
    return handle;
}`,
    steps: [
      {
        lines: [3, 6],
        title: "Native SPI2 IOMUX Pins",
        text: "GPIO10–13 map directly to the ESP32-S3 FSPI (SPI2) IOMUX pins, bypassing the GPIO Matrix for cleaner signal integrity.",
      },
      {
        lines: [9, 15],
        title: "Initialize Bus + GDMA",
        text: "spi_bus_initialize() claims SPI2_HOST and automatically assigns a GDMA channel for zero-overhead transfers.",
      },
      {
        lines: [17, 24],
        title: "Attach MFRC522 Slave",
        text: "MFRC522 uses SPI Mode 0 (CPOL=0, CPHA=0) up to 10 MHz; 4 MHz is rock-solid on breadboard jumpers.",
      },
    ],
  },
  {
    id: "ble",
    title: "BLE 5.0 GATT Server",
    file: "main/ble_gatt.c",
    code: `#include "esp_gap_ble_api.h"
#include "esp_gatts_api.h"

static esp_ble_adv_params_t adv_params = {
    .adv_int_min = 0x20,
    .adv_int_max = 0x40,
    .adv_type = ADV_TYPE_IND,
    .channel_map = ADV_CHNL_ALL,
    .adv_filter_policy = ADV_FILTER_ALLOW_SCAN_ANY_CON_ANY
};

void ble_start(void) {
    ESP_ERROR_CHECK(esp_ble_gatts_register_callback(gatts_event_handler));
    ESP_ERROR_CHECK(esp_ble_gap_start_advertising(&adv_params));
}`,
    steps: [
      {
        lines: [4, 10],
        title: "Advertising Interval & Channels",
        text: "0x20–0x40 corresponds to 20–40 ms intervals across all three 2.4 GHz BLE advertising channels (37, 38, 39).",
      },
      {
        lines: [13, 13],
        title: "Register GATT Event Handler",
        text: "esp_ble_gatts_register_callback() hooks up read/write/notify callbacks for your custom BLE characteristics.",
      },
      {
        lines: [14, 14],
        title: "Begin RF Broadcast",
        text: "esp_ble_gap_start_advertising() powers on the BLE 5.0 baseband scheduler so nearby phones can connect.",
      },
    ],
  },
  {
    id: "sound",
    title: "I2S Audio Tone Synth (MAX98357A)",
    file: "main/sound_i2s.c",
    code: `#include "driver/i2s_std.h"
#include <math.h>

#define I2S_BCLK  4
#define I2S_LRC   5
#define I2S_DIN   6

void audio_play_sine(i2s_chan_handle_t tx_handle) {
    i2s_chan_config_t chan_cfg = I2S_CHANNEL_DEFAULT_CONFIG(I2S_NUM_0, I2S_ROLE_MASTER);
    ESP_ERROR_CHECK(i2s_new_channel(&chan_cfg, &tx_handle, NULL));

    int16_t samples[256];
    for (int i = 0; i < 256; i++) {
        samples[i] = (int16_t)(12000 * sinf(2.0f * M_PI * i / 64.0f));
    }
    size_t written = 0;
    ESP_ERROR_CHECK(i2s_channel_write(tx_handle, samples, sizeof(samples), &written, 1000));
}`,
    steps: [
      {
        lines: [4, 6],
        title: "3-Wire I2S Audio Bus",
        text: "MAX98357A needs only BCLK (bit clock), LRC (word select), and DIN (serial PCM data) — no MCLK required!",
      },
      {
        lines: [9, 10],
        title: "Allocate I2S TX Channel",
        text: "i2s_new_channel() configures I2S0 in Master mode and reserves internal GDMA ring buffers.",
      },
      {
        lines: [12, 17],
        title: "Stream 16-bit PCM via GDMA",
        text: "We fill a 256-sample sine table and hand it to i2s_channel_write(), which streams continuously via DMA.",
      },
    ],
  },
];
