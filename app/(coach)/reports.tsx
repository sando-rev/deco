import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { format, startOfWeek, subWeeks } from 'date-fns';
import { nl, enUS } from 'date-fns/locale';
import { useActiveTeam } from '../../src/hooks/useActiveTeam';
import { useCoachReports, useSaveCoachReport, useDeleteCoachReport, CoachReport } from '../../src/hooks/useTeam';
import { Colors, Spacing, FontSize, BorderRadius } from '../../src/constants/theme';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';

export default function ReportsScreen() {
  const { t, i18n } = useTranslation();
  const { activeTeam: team } = useActiveTeam();
  const { data: reports, isLoading } = useCoachReports(team?.id);
  const saveReport = useSaveCoachReport();
  const deleteReport = useDeleteCoachReport();

  const [showForm, setShowForm] = useState(false);
  const [editingReport, setEditingReport] = useState<CoachReport | null>(null);
  const [notes, setNotes] = useState('');

  const locale = i18n.language === 'nl' ? nl : enUS;
  const currentWeekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');

  const handleNewReport = () => {
    setEditingReport(null);
    setNotes('');
    setShowForm(true);
  };

  const handleEdit = (report: CoachReport) => {
    setEditingReport(report);
    setNotes(report.notes);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!team?.id || !notes.trim()) return;
    try {
      await saveReport.mutateAsync({
        teamId: team.id,
        weekStart: editingReport?.week_start ?? currentWeekStart,
        notes: notes.trim(),
      });
      setShowForm(false);
      setNotes('');
      setEditingReport(null);
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message);
    }
  };

  const handleDelete = (report: CoachReport) => {
    Alert.alert(
      t('reports.deleteReport'),
      t('reports.deleteConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            if (team?.id) {
              await deleteReport.mutateAsync({ reportId: report.id, teamId: team.id });
            }
          },
        },
      ]
    );
  };

  if (showForm) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>
            {editingReport ? t('reports.editReport') : t('reports.newReport')}
          </Text>
          <Text style={styles.formWeek}>
            {t('reports.weekOf', {
              date: format(
                new Date(editingReport?.week_start ?? currentWeekStart),
                'd MMMM yyyy',
                { locale }
              ),
            })}
          </Text>
          <TextInput
            style={styles.textArea}
            placeholder={t('reports.notesPlaceholder')}
            placeholderTextColor={Colors.textTertiary}
            value={notes}
            onChangeText={setNotes}
            multiline
            textAlignVertical="top"
            autoFocus
          />
          <View style={styles.formButtons}>
            <Button
              title={t('common.cancel')}
              onPress={() => {
                setShowForm(false);
                setNotes('');
                setEditingReport(null);
              }}
              variant="outline"
              style={{ flex: 1 }}
            />
            <Button
              title={saveReport.isPending ? t('common.loading') : t('reports.saveReport')}
              onPress={handleSave}
              disabled={!notes.trim() || saveReport.isPending}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>{t('reports.title')}</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleNewReport}>
          <Ionicons name="add" size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: Spacing.xxl }} />
      ) : reports && reports.length > 0 ? (
        <FlatList
          data={reports}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Card style={styles.reportCard}>
              <View style={styles.reportHeader}>
                <Text style={styles.reportWeek}>
                  {t('reports.weekOf', {
                    date: format(new Date(item.week_start), 'd MMMM yyyy', { locale }),
                  })}
                </Text>
                <View style={styles.reportActions}>
                  <TouchableOpacity onPress={() => handleEdit(item)}>
                    <Ionicons name="create-outline" size={20} color={Colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(item)}>
                    <Ionicons name="trash-outline" size={20} color={Colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={styles.reportNotes}>{item.notes}</Text>
              <Text style={styles.reportDate}>
                {format(new Date(item.updated_at), 'd MMM HH:mm', { locale })}
              </Text>
            </Card>
          )}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.empty}>
          <Ionicons name="document-text-outline" size={48} color={Colors.textTertiary} />
          <Text style={styles.emptyTitle}>{t('reports.noReports')}</Text>
          <Text style={styles.emptyText}>{t('reports.noReportsDesc')}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  reportCard: {
    marginBottom: Spacing.md,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  reportWeek: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  reportActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  reportNotes: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  reportDate: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginTop: Spacing.sm,
  },
  formContainer: {
    flex: 1,
    padding: Spacing.lg,
  },
  formTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  formWeek: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  textArea: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.text,
    lineHeight: 24,
    marginBottom: Spacing.lg,
  },
  formButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  emptyText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
