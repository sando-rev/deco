import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import { useTranslation } from 'react-i18next';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/hooks/useAuth';
import {
  useSkillDefinitionsForPosition,
  useSelectedSkills,
  useLatestSkillScores,
  useSaveSkillScores,
  useSaveSelectedSkills,
  useCreateCustomSkill,
  useDeleteCustomSkill,
} from '../../src/hooks/useSkills';
import { RadarChart, RadarSkill } from '../../src/components/RadarChart';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { SKILL_CATEGORIES } from '../../src/constants/skills';
import { Colors, Spacing, FontSize, BorderRadius } from '../../src/constants/theme';
import { PositionType, SkillCategory, SkillDefinition } from '../../src/types/database';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { data: selectedSkills, isLoading: loadingSkills } = useSelectedSkills();
  const { data: skillScores, isLoading: loadingScores } = useLatestSkillScores();
  const [isEditing, setIsEditing] = useState(false);
  const [editScores, setEditScores] = useState<Record<string, number> | null>(null);
  const saveScores = useSaveSkillScores();

  // Skill editor state
  const [showSkillEditor, setShowSkillEditor] = useState(false);
  const [editorSelection, setEditorSelection] = useState<Set<string>>(new Set());
  const [newSkillScores, setNewSkillScores] = useState<Record<string, number> | null>(null);
  const [showNewSkillSliders, setShowNewSkillSliders] = useState(false);
  const saveSelectedSkills = useSaveSelectedSkills();

  // Custom skill form state
  const [customFormCategory, setCustomFormCategory] = useState<SkillCategory | null>(null);
  const [customLabel, setCustomLabel] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const createCustomSkill = useCreateCustomSkill();
  const deleteCustomSkill = useDeleteCustomSkill();

  const position: PositionType = (profile?.position ?? 'outfield') as PositionType;
  const { data: positionSkills } = useSkillDefinitionsForPosition(position);

  const isLoading = loadingSkills || loadingScores;

  // Build score map from latest scores
  const scoreMap = new Map(
    (skillScores ?? []).map((s) => [s.skill_id, s.score])
  );

  // Build radar chart data
  const buildRadarSkills = (scores: Map<string, number> | Record<string, number>): RadarSkill[] => {
    return (selectedSkills ?? []).map((skill) => ({
      label: skill.label,
      score: scores instanceof Map ? (scores.get(skill.id) ?? 5) : (scores[skill.id] ?? 5),
    }));
  };

  const radarSkills = isEditing && editScores
    ? buildRadarSkills(editScores)
    : buildRadarSkills(scoreMap);

  const comparisonSkills = isEditing ? buildRadarSkills(scoreMap) : undefined;

  // Group selected skills by category
  const groupedSkills = SKILL_CATEGORIES.map((cat) => ({
    category: cat,
    skills: (selectedSkills ?? []).filter((s) => s.category === cat.key),
  })).filter((g) => g.skills.length > 0);

  // Group all position skills by category for the editor
  const editorGroupedSkills = SKILL_CATEGORIES.map((cat) => ({
    category: cat,
    skills: (positionSkills ?? []).filter((s) => s.category === cat.key),
  })).filter((g) => g.skills.length > 0);

  const startEditing = () => {
    const scores: Record<string, number> = {};
    (selectedSkills ?? []).forEach((skill) => {
      scores[skill.id] = scoreMap.get(skill.id) ?? 5;
    });
    setEditScores(scores);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!editScores) return;
    try {
      const scoreEntries = Object.entries(editScores).map(([skill_id, score]) => ({
        skill_id,
        score,
      }));
      await saveScores.mutateAsync(scoreEntries);
      setIsEditing(false);
      setEditScores(null);
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message);
    }
  };

  // --- Skill editor logic ---

  const openSkillEditor = () => {
    const currentIds = new Set((selectedSkills ?? []).map((s) => s.id));
    setEditorSelection(new Set(currentIds));
    setShowNewSkillSliders(false);
    setNewSkillScores(null);
    setShowSkillEditor(true);
  };

  const toggleSkill = (skillId: string, categoryKey: string) => {
    setEditorSelection((prev) => {
      const next = new Set(prev);
      if (next.has(skillId)) {
        // Enforce minimum 3 per category
        const cat = SKILL_CATEGORIES.find((c) => c.key === categoryKey);
        const categorySkills = (positionSkills ?? []).filter((s) => s.category === categoryKey);
        const selectedInCat = categorySkills.filter((s) => next.has(s.id));
        if (selectedInCat.length <= (cat?.minSelection ?? 3)) {
          Alert.alert(t('profile.minReached'), t('profile.minReachedMsg', { count: cat?.minSelection ?? 3 }));
          return prev;
        }
        next.delete(skillId);
      } else {
        // Enforce maximum 5 per category
        const cat = SKILL_CATEGORIES.find((c) => c.key === categoryKey);
        const categorySkills = (positionSkills ?? []).filter((s) => s.category === categoryKey);
        const selectedInCat = categorySkills.filter((s) => next.has(s.id));
        if (selectedInCat.length >= (cat?.maxSelection ?? 5)) {
          Alert.alert(t('profile.maxReached'), t('profile.maxReachedMsg', { count: cat?.maxSelection ?? 5 }));
          return prev;
        }
        next.add(skillId);
      }
      return next;
    });
  };

  const handleSaveSkillEditor = async () => {
    try {
      const currentIds = new Set((selectedSkills ?? []).map((s) => s.id));
      const newlyAddedIds = [...editorSelection].filter((id) => !currentIds.has(id));

      await saveSelectedSkills.mutateAsync([...editorSelection]);

      if (newlyAddedIds.length > 0) {
        // Find skills without existing scores
        const unscored = newlyAddedIds.filter((id) => !scoreMap.has(id));
        if (unscored.length > 0) {
          const initialScores: Record<string, number> = {};
          unscored.forEach((id) => { initialScores[id] = 5; });
          setNewSkillScores(initialScores);
          setShowNewSkillSliders(true);
          return; // Keep modal open to show sliders
        }
      }

      setShowSkillEditor(false);
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message);
    }
  };

  const handleSaveNewSkillScores = async () => {
    if (!newSkillScores) return;
    try {
      const scoreEntries = Object.entries(newSkillScores).map(([skill_id, score]) => ({
        skill_id,
        score,
      }));
      await saveScores.mutateAsync(scoreEntries);
      setShowNewSkillSliders(false);
      setNewSkillScores(null);
      setShowSkillEditor(false);
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message);
    }
  };

  // Skills that need scoring (for the new skill sliders step)
  const newSkillDefinitions: SkillDefinition[] = useMemo(() => {
    if (!newSkillScores) return [];
    return (positionSkills ?? []).filter((s) => Object.keys(newSkillScores).includes(s.id));
  }, [newSkillScores, positionSkills]);

  const positionLabel = position === 'goalkeeper' ? 'Keeper' : 'Veldspeler';

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Profile header */}
        <View style={styles.greeting}>
          <Text style={styles.greetingText}>
            {t('profile.welcomeBack', { name: profile?.full_name?.split(' ')[0] })}
          </Text>
          <Text style={styles.greetingSubtext}>{t('profile.yourProfile')}</Text>
        </View>

        <Card style={styles.chartCard}>
          {radarSkills.length >= 3 ? (
            <RadarChart
              skills={radarSkills}
              size={300}
              comparisonSkills={comparisonSkills}
            />
          ) : (
            <Text style={styles.noSkillsText}>{t('profile.completeOnboarding')}</Text>
          )}
        </Card>

        {!isEditing ? (
          <>
            {groupedSkills.map(({ category, skills }) => (
              <View key={category.key} style={styles.categorySection}>
                <View style={styles.categoryHeader}>
                  <Ionicons name={category.icon as any} size={16} color={Colors.primary} />
                  <Text style={styles.categoryLabel}>{category.label}</Text>
                </View>
                <View style={styles.scoresGrid}>
                  {skills.map((skill) => {
                    const value = scoreMap.get(skill.id) ?? 0;
                    return (
                      <Card key={skill.id} style={styles.scoreCard} padding={Spacing.sm}>
                        <Ionicons name={skill.icon as any} size={20} color={Colors.primary} />
                        <Text style={styles.scoreValue}>{value}</Text>
                        <Text style={styles.scoreLabel}>{skill.label}</Text>
                      </Card>
                    );
                  })}
                </View>
              </View>
            ))}
            <Button
              title={t('profile.reassessSkills')}
              onPress={startEditing}
              variant="outline"
              style={styles.editButton}
              icon={<Ionicons name="refresh-outline" size={18} color={Colors.primary} />}
            />
            <Button
              title={t('profile.editSkills')}
              onPress={openSkillEditor}
              variant="outline"
              style={styles.editButton}
              icon={<Ionicons name="create-outline" size={18} color={Colors.primary} />}
            />
          </>
        ) : (
          <View style={styles.editContainer}>
            <Text style={styles.editHint}>
              {t('profile.editHint')}
            </Text>
            {groupedSkills.map(({ category, skills }) => (
              <View key={category.key}>
                <View style={styles.categoryHeader}>
                  <Ionicons name={category.icon as any} size={16} color={Colors.primary} />
                  <Text style={styles.categoryLabel}>{category.label}</Text>
                </View>
                {skills.map((skill) => (
                  <View key={skill.id} style={styles.sliderRow}>
                    <View style={styles.sliderHeader}>
                      <Text style={styles.sliderName}>{skill.label}</Text>
                      <Text style={styles.sliderValue}>{editScores![skill.id]}</Text>
                    </View>
                    <Slider
                      style={styles.slider}
                      minimumValue={1}
                      maximumValue={10}
                      step={1}
                      value={editScores![skill.id]}
                      onValueChange={(v) =>
                        setEditScores((prev) => ({ ...prev!, [skill.id]: Math.round(v) }))
                      }
                      minimumTrackTintColor={Colors.primary}
                      maximumTrackTintColor={Colors.border}
                      thumbTintColor={Colors.primary}
                    />
                  </View>
                ))}
              </View>
            ))}
            <View style={styles.editActions}>
              <Button
                title={t('common.cancel')}
                onPress={() => {
                  setIsEditing(false);
                  setEditScores(null);
                }}
                variant="outline"
                style={{ flex: 1 }}
              />
              <Button
                title={t('common.save')}
                onPress={handleSave}
                loading={saveScores.isPending}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Skill editor modal */}
      <Modal
        visible={showSkillEditor}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSkillEditor(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {showNewSkillSliders ? t('profile.scoreNewSkills') : t('profile.editSkillsTitle')}
            </Text>
            {!showNewSkillSliders && (
              <TouchableOpacity
                onPress={() => setShowSkillEditor(false)}
                style={styles.modalCloseBtn}
                accessibilityLabel={t('common.close')}
                accessibilityRole="button"
              >
                <Ionicons name="close" size={22} color={Colors.text} />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.modalScrollContent}
          >
            {!showNewSkillSliders ? (
              <>
                <Text style={styles.modalHint}>
                  {t('profile.selectHint')}
                </Text>
                {editorGroupedSkills.map(({ category, skills: categorySkills }) => {
                  const selectedInCat = categorySkills.filter((s) => editorSelection.has(s.id));
                  const catDef = SKILL_CATEGORIES.find((c) => c.key === category.key);
                  const atMin = selectedInCat.length <= (catDef?.minSelection ?? 3);
                  const atMax = selectedInCat.length >= (catDef?.maxSelection ?? 5);
                  const hasCustomInCategory = categorySkills.some((s) => s.created_by_athlete_id !== null);

                  return (
                    <View key={category.key} style={styles.editorCategory}>
                      <View style={styles.categoryHeader}>
                        <Ionicons name={category.icon as any} size={16} color={Colors.primary} />
                        <Text style={styles.categoryLabel}>{category.label}</Text>
                        <Text style={styles.selectionCount}>
                          {selectedInCat.length}/{catDef?.maxSelection ?? 5}
                        </Text>
                      </View>
                      {categorySkills.map((skill) => {
                        const selected = editorSelection.has(skill.id);
                        const disabled = !selected && atMax;
                        const isCustom = skill.created_by_athlete_id !== null;
                        return (
                          <TouchableOpacity
                            key={skill.id}
                            style={[
                              styles.skillRow,
                              selected && styles.skillRowSelected,
                              disabled && styles.skillRowDisabled,
                            ]}
                            onPress={() => toggleSkill(skill.id, category.key)}
                            activeOpacity={0.7}
                            accessibilityRole="checkbox"
                            accessibilityState={{ checked: selected, disabled }}
                            accessibilityLabel={skill.label}
                          >
                            <Ionicons
                              name={skill.icon as any}
                              size={18}
                              color={selected ? Colors.primary : Colors.textSecondary}
                            />
                            <View style={styles.skillRowText}>
                              <Text
                                style={[
                                  styles.skillRowLabel,
                                  selected && styles.skillRowLabelSelected,
                                  disabled && styles.skillRowLabelDisabled,
                                ]}
                              >
                                {skill.label}
                              </Text>
                              {skill.description ? (
                                <Text style={styles.skillRowDescription} numberOfLines={1}>
                                  {skill.description}
                                </Text>
                              ) : null}
                            </View>
                            {isCustom ? (
                              <TouchableOpacity
                                style={styles.deleteSkillBtn}
                                onPress={async () => {
                                  try {
                                    await deleteCustomSkill.mutateAsync(skill.id);
                                    setEditorSelection((prev) => {
                                      const next = new Set(prev);
                                      next.delete(skill.id);
                                      return next;
                                    });
                                  } catch (error: any) {
                                    Alert.alert(t('common.error'), error.message);
                                  }
                                }}
                                accessibilityLabel={`Verwijder ${skill.label}`}
                                accessibilityRole="button"
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                              >
                                <Ionicons name="trash-outline" size={16} color={Colors.textSecondary} />
                              </TouchableOpacity>
                            ) : (
                              <View
                                style={[
                                  styles.checkbox,
                                  selected && styles.checkboxSelected,
                                ]}
                              >
                                {selected && (
                                  <Ionicons name="checkmark" size={14} color="#fff" />
                                )}
                              </View>
                            )}
                          </TouchableOpacity>
                        );
                      })}

                      {/* Custom skill: add button or inline form */}
                      {!hasCustomInCategory && customFormCategory !== category.key ? (
                        <TouchableOpacity
                          style={styles.addCustomSkillBtn}
                          onPress={() => {
                            setCustomFormCategory(category.key as SkillCategory);
                            setCustomLabel('');
                            setCustomDescription('');
                          }}
                          accessibilityRole="button"
                          accessibilityLabel={t('profile.addCustomSkill')}
                        >
                          <Ionicons name="add-circle-outline" size={16} color={Colors.primary} />
                          <Text style={styles.addCustomSkillBtnText}>{t('profile.addCustomSkill')}</Text>
                        </TouchableOpacity>
                      ) : customFormCategory === category.key ? (
                        <View style={styles.customSkillForm}>
                          <TextInput
                            style={styles.customSkillInput}
                            placeholder={t('onboarding.skillName')}
                            placeholderTextColor={Colors.textSecondary}
                            value={customLabel}
                            onChangeText={setCustomLabel}
                            maxLength={60}
                            accessibilityLabel={t('onboarding.skillName')}
                          />
                          <TextInput
                            style={[styles.customSkillInput, styles.customSkillInputDescription]}
                            placeholder={t('onboarding.skillDescription')}
                            placeholderTextColor={Colors.textSecondary}
                            value={customDescription}
                            onChangeText={setCustomDescription}
                            maxLength={120}
                            multiline
                            accessibilityLabel={t('onboarding.skillDescription')}
                          />
                          <View style={styles.customSkillFormActions}>
                            <TouchableOpacity
                              style={styles.customSkillCancelBtn}
                              onPress={() => {
                                setCustomFormCategory(null);
                                setCustomLabel('');
                                setCustomDescription('');
                              }}
                              accessibilityRole="button"
                              accessibilityLabel={t('common.cancel')}
                            >
                              <Text style={styles.customSkillCancelText}>{t('common.cancel')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[
                                styles.customSkillAddBtn,
                                (!customLabel.trim() || createCustomSkill.isPending) && styles.customSkillAddBtnDisabled,
                              ]}
                              onPress={async () => {
                                if (!customLabel.trim()) return;
                                try {
                                  const newSkill = await createCustomSkill.mutateAsync({
                                    label: customLabel.trim(),
                                    description: customDescription.trim(),
                                    category: category.key as SkillCategory,
                                    position_type: position,
                                  });
                                  setEditorSelection((prev) => {
                                    const next = new Set(prev);
                                    next.add(newSkill.id);
                                    return next;
                                  });
                                  setCustomFormCategory(null);
                                  setCustomLabel('');
                                  setCustomDescription('');
                                } catch (error: any) {
                                  Alert.alert(t('common.error'), error.message);
                                }
                              }}
                              disabled={!customLabel.trim() || createCustomSkill.isPending}
                              accessibilityRole="button"
                              accessibilityLabel={t('common.add')}
                            >
                              <Text style={styles.customSkillAddText}>{t('common.add')}</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ) : null}
                    </View>
                  );
                })}
              </>
            ) : (
              <>
                <Text style={styles.modalHint}>
                  {t('profile.scoreHint')}
                </Text>
                {newSkillDefinitions.map((skill) => (
                  <View key={skill.id} style={styles.sliderRow}>
                    <View style={styles.sliderHeader}>
                      <Text style={styles.sliderName}>{skill.label}</Text>
                      <Text style={styles.sliderValue}>{newSkillScores![skill.id]}</Text>
                    </View>
                    <Slider
                      style={styles.slider}
                      minimumValue={1}
                      maximumValue={10}
                      step={1}
                      value={newSkillScores![skill.id]}
                      onValueChange={(v) =>
                        setNewSkillScores((prev) => ({ ...prev!, [skill.id]: Math.round(v) }))
                      }
                      minimumTrackTintColor={Colors.primary}
                      maximumTrackTintColor={Colors.border}
                      thumbTintColor={Colors.primary}
                    />
                  </View>
                ))}
              </>
            )}
          </ScrollView>

          <View style={styles.modalActions}>
            {!showNewSkillSliders ? (
              <>
                <Button
                  title={t('common.cancel')}
                  onPress={() => setShowSkillEditor(false)}
                  variant="outline"
                  style={{ flex: 1 }}
                />
                <Button
                  title={t('common.save')}
                  onPress={handleSaveSkillEditor}
                  loading={saveSelectedSkills.isPending}
                  style={{ flex: 1 }}
                />
              </>
            ) : (
              <Button
                title={t('profile.saveScores')}
                onPress={handleSaveNewSkillScores}
                loading={saveScores.isPending}
                style={{ flex: 1 }}
              />
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  greeting: {
    marginBottom: Spacing.sm,
  },
  greetingText: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.text,
  },
  greetingSubtext: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  positionBadgeRow: {
    flexDirection: 'row',
    marginBottom: Spacing.lg,
  },
  positionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.full ?? 999,
    borderWidth: 1,
    borderColor: Colors.border,
    alignSelf: 'flex-start',
  },
  positionBadgeText: {
    fontSize: FontSize.xs ?? 11,
    fontWeight: '600',
    color: Colors.primary,
  },
  chartCard: {
    alignItems: 'center',
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  noSkillsText: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    fontStyle: 'italic',
    paddingVertical: Spacing.xxl,
  },
  categorySection: {
    marginBottom: Spacing.md,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  categoryLabel: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1,
  },
  selectionCount: {
    fontSize: FontSize.xs ?? 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  scoresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  scoreCard: {
    width: '23%',
    flexGrow: 1,
    alignItems: 'center',
    gap: 4,
    minWidth: 75,
  },
  scoreValue: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.text,
  },
  scoreLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  editButton: {
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  editContainer: {
    marginBottom: Spacing.lg,
  },
  editHint: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  sliderRow: {
    marginBottom: Spacing.sm,
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sliderName: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  sliderValue: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.primary,
  },
  slider: {
    width: '100%',
    height: 30,
  },
  editActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  modalCloseBtn: {
    padding: Spacing.xs ?? 4,
  },
  modalScroll: {
    flex: 1,
  },
  modalScrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  modalHint: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    fontStyle: 'italic',
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  editorCategory: {
    marginBottom: Spacing.lg,
  },
  skillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs ?? 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  skillRowSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.surface,
  },
  skillRowDisabled: {
    opacity: 0.4,
  },
  skillRowText: {
    flex: 1,
  },
  skillRowLabel: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  skillRowLabelSelected: {
    color: Colors.text,
  },
  skillRowLabelDisabled: {
    color: Colors.textSecondary,
  },
  skillRowDescription: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  deleteSkillBtn: {
    padding: 4,
  },
  addCustomSkillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs ?? 6,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.xs ?? 6,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    borderRadius: BorderRadius.sm,
  },
  addCustomSkillBtnText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.primary,
  },
  customSkillForm: {
    marginTop: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  customSkillInput: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs ?? 8,
    fontSize: FontSize.sm,
    color: Colors.text,
  },
  customSkillInputDescription: {
    minHeight: 56,
    textAlignVertical: 'top',
  },
  customSkillFormActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'flex-end',
    marginTop: Spacing.xs ?? 4,
  },
  customSkillCancelBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs ?? 8,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  customSkillCancelText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  customSkillAddBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs ?? 8,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.primary,
  },
  customSkillAddBtnDisabled: {
    opacity: 0.4,
  },
  customSkillAddText: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: '#fff',
  },
});
