package services

import (
	"encoding/json"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/artemstepanov/caddy-ui/models"

	"github.com/dgraph-io/badger/v4"

	"github.com/google/uuid"
)

var db *badger.DB

// InitDB Initialize BadgerDB
func InitDB() error {
	opts := badger.DefaultOptions("./badger")
	var err error
	db, err = badger.Open(opts)
	return err
}

// CloseDB Close BadgerDB
func CloseDB() {
	db.Close()
}

// UpsertInstance Upsert a Caddy instance to the database
func UpsertInstance(instance *models.CaddyInstance) {
	if instance.ID == "" {
		instance.ID = uuid.New().String()
	}
	instanceBytes, err := json.Marshal(instance)
	if err != nil {
		log.Println("Error marshalling instance:", err)
		return
	}

	err = db.Update(func(txn *badger.Txn) error {
		return txn.Set([]byte(instance.ID), instanceBytes)
	})
	if err != nil {
		log.Println("Error adding instance:", err)
	}
}

// GetAllInstances Get all Caddy instances from the database
func GetAllInstances() []models.CaddyInstance {
	var instances []models.CaddyInstance
	err := db.View(func(txn *badger.Txn) error {
		opts := badger.DefaultIteratorOptions
		it := txn.NewIterator(opts)
		defer it.Close()

		for it.Rewind(); it.Valid(); it.Next() {
			item := it.Item()
			err := item.Value(func(val []byte) error {
				var instance models.CaddyInstance
				err := json.Unmarshal(val, &instance)
				if err != nil {
					return err
				}
				instances = append(instances, instance)
				return nil
			})
			if err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		log.Println("Error fetching instances", err)
	}
	return instances
}

// DeleteInstance Delete a Caddy instance from the database
func DeleteInstance(id string) {
	err := db.Update(func(txn *badger.Txn) error {
		return txn.Delete([]byte(id))
	})
	if err != nil {
		log.Println("Error deleting instance", err)
	}
}

// SaveEditHistory saves an edit history entry to the database
func SaveEditHistory(instanceID, oldConfig, newConfig, editedBy string) {
	editID := uuid.New()
	history := models.EditHistory{
		ID:         editID,
		Timestamp:  time.Now(),
		OldConfig:  oldConfig,
		NewConfig:  newConfig,
		EditedBy:   editedBy,
		InstanceID: instanceID,
	}

	historyBytes, err := json.Marshal(history)
	if err != nil {
		log.Println("Error marshalling edit history:", err)
		return
	}

	err = db.Update(func(txn *badger.Txn) error {
		return txn.Set([]byte("history:"+editID.String()), historyBytes)
	})
	if err != nil {
		log.Println("Error saving edit history:", err)
	}
}

// GetEditHistory retrieves the edit history for a given Caddy instance
func GetEditHistory(instanceID string) []models.EditHistory {
	var histories []models.EditHistory

	err := db.View(func(txn *badger.Txn) error {
		opts := badger.DefaultIteratorOptions
		it := txn.NewIterator(opts)
		defer it.Close()

		for it.Rewind(); it.Valid(); it.Next() {
			item := it.Item()
			key := string(item.Key())
			if keyHasPrefix(key, "history:") { // helper function to check key prefix
				var history models.EditHistory
				err := item.Value(func(val []byte) error {
					return json.Unmarshal(val, &history)
				})
				if err != nil {
					return err
				}

				if history.InstanceID == instanceID {
					histories = append(histories, history)
				}
			}
		}
		return nil
	})

	if err != nil {
		log.Println("Error retrieving edit history:", err)
	}

	return histories
}

// SaveConfigHistory Store the history of changes in BadgerDB
func SaveConfigHistory(instanceID string, oldConfig, newConfig string) error {
	historyID := fmt.Sprintf("%s-%d", instanceID, time.Now().Unix())
	return db.Update(func(txn *badger.Txn) error {
		err := txn.Set([]byte("history:"+historyID), []byte(fmt.Sprintf("old: %s\nnew: %s", oldConfig, newConfig)))
		return err
	})
}

// ApplyCaddyConfigWithHistory Apply Caddy config and save history
func ApplyCaddyConfigWithHistory(caddyURL string, newConfig []byte, instanceID string) error {
	// Fetch the old config before applying the new one
	oldConfig, err := FetchCaddyConfig(caddyURL)
	if err != nil {
		return err
	}

	// Save the history of changes
	err = SaveConfigHistory(instanceID, oldConfig, string(newConfig))
	if err != nil {
		return err
	}

	// Now apply the new config
	return ApplyCaddyConfig(caddyURL, newConfig)
}

// GetInstance GetCaddyInstance retrieves a Caddy instance by ID
func GetInstance(id string) models.CaddyInstance {
	var instance models.CaddyInstance
	err := db.View(func(txn *badger.Txn) error {
		item, err := txn.Get([]byte(id))
		if err != nil {
			return err
		}

		err = item.Value(func(val []byte) error {
			instance = models.CaddyInstance{
				ID:   id,
				URL:  string(val),
				Name: id, // Placeholder, you may store names separately
			}
			return nil
		})
		return err
	})
	if err != nil {
		log.Println("Error fetching instance", err)
	}
	return instance
}

func keyHasPrefix(key, s string) bool {
	return strings.HasPrefix(key, s)
}
